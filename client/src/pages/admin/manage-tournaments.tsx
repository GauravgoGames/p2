import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Tournament } from '@shared/schema';
import { Trophy, Plus, Edit, Trash2, Calendar, Users, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

interface TournamentFormData {
  name: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
}

export default function ManageTournaments() {
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    description: '',
    imageUrl: '',
    startDate: '',
    endDate: '',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tournaments
  const { data: tournaments, isLoading } = useQuery<(Tournament & { matchCount: number })[]>({
    queryKey: ['/api/tournaments'],
    queryFn: async () => {
      const res = await fetch('/api/tournaments');
      if (!res.ok) throw new Error('Failed to fetch tournaments');
      return res.json();
    }
  });

  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload image');
      return response.json();
    },
  });

  // Create tournament mutation
  const createTournamentMutation = useMutation({
    mutationFn: async (data: TournamentFormData) => {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create tournament');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      toast({
        title: "Success",
        description: "Tournament created successfully!",
      });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create tournament. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update tournament mutation
  const updateTournamentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TournamentFormData }) => {
      const response = await fetch(`/api/tournaments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update tournament');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      toast({
        title: "Success",
        description: "Tournament updated successfully!",
      });
      setEditingTournament(null);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update tournament. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete tournament mutation
  const deleteTournamentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/tournaments/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to delete tournament');
      }
      // Handle 204 No Content response
      if (response.status === 204) {
        return { success: true };
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      toast({
        title: "Success",
        description: "Tournament deleted successfully!",
      });
      setDeleteDialogOpen(false);
      setTournamentToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tournament. Please try again.",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setTournamentToDelete(null);
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      startDate: '',
      endDate: '',
    });
    setImageFile(null);
    setImagePreview('');
  };

  const handleEdit = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setFormData({
      name: tournament.name,
      description: tournament.description || '',
      imageUrl: tournament.imageUrl || '',
      startDate: tournament.startDate ? new Date(tournament.startDate).toISOString().slice(0, 16) : '',
      endDate: tournament.endDate ? new Date(tournament.endDate).toISOString().slice(0, 16) : '',
    });
    setImagePreview(tournament.imageUrl || '');
  };

  const handleDelete = (tournament: Tournament) => {
    setTournamentToDelete(tournament);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let imageUrl = formData.imageUrl;
    
    // Upload image if a file was selected
    if (imageFile) {
      try {
        const uploadResult = await uploadImageMutation.mutateAsync(imageFile);
        imageUrl = uploadResult.url;
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }
    
    const tournamentData = { ...formData, imageUrl };
    
    if (editingTournament) {
      updateTournamentMutation.mutate({ id: editingTournament.id, data: tournamentData });
    } else {
      createTournamentMutation.mutate(tournamentData);
    }
  };

  const isLoading_form = createTournamentMutation.isPending || updateTournamentMutation.isPending || uploadImageMutation.isPending;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-800 flex items-center">
          <Trophy className="h-8 w-8 mr-3 text-primary" />
          Manage Tournaments
        </h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tournament
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="w-full h-32 bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tournaments && tournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament, index) => (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  {tournament.imageUrl && (
                    <div className="w-full h-32 mb-3 rounded-lg overflow-hidden">
                      <img 
                        src={tournament.imageUrl} 
                        alt={tournament.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardTitle className="text-lg">{tournament.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {tournament.description && (
                    <p className="text-neutral-600 text-sm mb-3 line-clamp-2">
                      {tournament.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-neutral-500 mb-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {tournament.matchCount} matches
                    </div>
                    {tournament.startDate && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(tournament.startDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(tournament)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(tournament)}
                      className="flex-1 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="p-8 border-dashed border-2 border-gray-200 bg-gray-50">
          <div className="text-center py-6 text-gray-600">
            <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium mb-2">No Tournaments Yet</h3>
            <p className="mb-4">Create your first tournament to get started.</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tournament
            </Button>
          </div>
        </Card>
      )}

      {/* Create/Edit Tournament Dialog */}
      <Dialog open={createDialogOpen || !!editingTournament} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false);
          setEditingTournament(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTournament ? 'Edit Tournament' : 'Create New Tournament'}
            </DialogTitle>
            <DialogDescription>
              {editingTournament ? 'Update tournament details' : 'Add a new tournament to the system'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tournament Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Tournament Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. T20 World Cup"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tournament description..."
                rows={3}
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Tournament Image</Label>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
                
                {imagePreview && (
                  <div className="border rounded-lg p-2">
                    <img
                      src={imagePreview}
                      alt="Tournament preview"
                      className="w-full h-48 object-cover rounded"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate ? formData.startDate.split('T')[0] : ''}
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    if (dateValue) {
                      setFormData({ ...formData, startDate: dateValue + 'T00:00' });
                    } else {
                      setFormData({ ...formData, startDate: '' });
                    }
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate ? formData.endDate.split('T')[0] : ''}
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    if (dateValue) {
                      setFormData({ ...formData, endDate: dateValue + 'T23:59' });
                    } else {
                      setFormData({ ...formData, endDate: '' });
                    }
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading_form || !formData.name.trim()} className="flex-1">
                {isLoading_form ? 'Saving...' : (editingTournament ? 'Update Tournament' : 'Create Tournament')}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (editingTournament) {
                    setEditingTournament(null);
                  } else {
                    setCreateDialogOpen(false);
                  }
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tournament</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{tournamentToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => tournamentToDelete && deleteTournamentMutation.mutate(tournamentToDelete.id)}
              disabled={deleteTournamentMutation.isPending}
            >
              {deleteTournamentMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}