import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';
import { Team, Tournament, insertTeamSchema } from '@shared/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';

// Team form schema
const teamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  logoUrl: z.string().optional(),
  isCustom: z.boolean().default(true),
  tournamentIds: z.array(z.number()).optional(),
});

type TeamFormData = z.infer<typeof teamSchema>;

const ManageTeams = () => {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Fetch all teams
  const { data: teams, isLoading } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const res = await fetch('/api/teams');
      if (!res.ok) throw new Error('Failed to fetch teams');
      return res.json();
    }
  });

  // Fetch all tournaments
  const { data: tournaments } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
    queryFn: async () => {
      const res = await fetch('/api/tournaments');
      if (!res.ok) throw new Error('Failed to fetch tournaments');
      return res.json();
    }
  });
  
  // Team form
  const createTeamForm = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: '',
      logoUrl: '',
      isCustom: true,
    },
  });
  
  // Edit team form
  const editTeamForm = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: '',
      logoUrl: '',
      isCustom: true,
    },
  });
  
  // Handle logo upload
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };
  
  // Upload logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      
      const res = await fetch('/api/teams/upload-logo', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error('Logo upload failed');
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      if (createDialogOpen) {
        createTeamForm.setValue('logoUrl', data.logoUrl);
      } else if (editDialogOpen) {
        editTeamForm.setValue('logoUrl', data.logoUrl);
      }
      toast({
        title: 'Logo uploaded',
        description: 'Team logo uploaded successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to upload logo: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (data: TeamFormData) => {
      // Manual logo upload first if there's a file
      if (logoFile) {
        // Create a FormData object
        const formData = new FormData();
        formData.append('logo', logoFile);
        
        // Upload the logo
        const uploadRes = await fetch('/api/teams/upload-logo', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        
        if (!uploadRes.ok) {
          throw new Error('Logo upload failed');
        }
        
        const logoData = await uploadRes.json();
        data.logoUrl = logoData.logoUrl;
      }
      
      // Then create the team
      const res = await apiRequest('POST', '/api/teams', data);
      const teamData = await res.json();
      
      // Associate team with selected tournaments
      if (data.tournamentIds && data.tournamentIds.length > 0) {
        for (const tournamentId of data.tournamentIds) {
          await apiRequest('POST', `/api/tournaments/${tournamentId}/teams`, {
            teamId: teamData.id
          });
        }
      }
      
      return teamData;
    },
    onSuccess: () => {
      toast({
        title: 'Team Created',
        description: 'The team has been successfully created',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      setCreateDialogOpen(false);
      createTeamForm.reset();
      setLogoFile(null);
      setLogoPreview(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create team',
        variant: 'destructive',
      });
    },
  });
  
  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/teams/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Team Deleted',
        description: 'The team has been successfully deleted',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      setDeleteDialogOpen(false);
      setSelectedTeam(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete team',
        variant: 'destructive',
      });
    },
  });
  
  // Form submission handlers
  const onCreateTeamSubmit = async (data: TeamFormData) => {
    createTeamMutation.mutate(data);
  };
  
  const handleDeleteTeam = (team: Team) => {
    setSelectedTeam(team);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteTeam = () => {
    if (!selectedTeam) return;
    deleteTeamMutation.mutate(selectedTeam.id);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-heading">Manage Teams</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Team
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Team List</CardTitle>
          <CardDescription>
            Manage cricket teams for matches and predictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : teams && teams.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Logo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          {team.logoUrl ? (
                            <AvatarImage src={team.logoUrl} alt={team.name} />
                          ) : (
                            <AvatarFallback>{team.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          )}
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>
                        <Badge variant={team.isCustom ? 'default' : 'outline'}>
                          {team.isCustom ? 'Custom' : 'Official'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                            onClick={() => handleDeleteTeam(team)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-neutral-500">
              No teams found
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Create Team Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Add a new cricket team to the system
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createTeamForm}>
            <form onSubmit={createTeamForm.handleSubmit(onCreateTeamSubmit)} className="space-y-6">
              <FormField
                control={createTeamForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Mumbai Indians" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormLabel>Team Logo</FormLabel>
                <div className="flex gap-4 items-center">
                  <div className="border-2 border-dashed border-neutral-300 rounded-lg p-4 flex flex-col items-center justify-center w-32 h-32">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Team logo preview" className="max-h-full max-w-full" />
                    ) : (
                      <div className="text-neutral-400 text-center">
                        <Upload className="mx-auto h-8 w-8 mb-2" />
                        <span className="text-xs">Upload logo</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      className="mt-1"
                      onChange={handleLogoChange}
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Recommended size: 512x512px. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tournament Selection */}
              <div className="space-y-3">
                <FormLabel>Associated Tournaments</FormLabel>
                <FormDescription>
                  Select which tournaments this team will participate in
                </FormDescription>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
                  {tournaments?.map((tournament) => (
                    <div key={tournament.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tournament-${tournament.id}`}
                        checked={createTeamForm.watch('tournamentIds')?.includes(tournament.id) || false}
                        onCheckedChange={(checked) => {
                          const currentIds = createTeamForm.getValues('tournamentIds') || [];
                          if (checked) {
                            createTeamForm.setValue('tournamentIds', [...currentIds, tournament.id]);
                          } else {
                            createTeamForm.setValue('tournamentIds', currentIds.filter(id => id !== tournament.id));
                          }
                        }}
                      />
                      <label 
                        htmlFor={`tournament-${tournament.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {tournament.name}
                      </label>
                    </div>
                  ))}
                  {!tournaments?.length && (
                    <p className="text-sm text-neutral-500 text-center py-2">
                      No tournaments available. Create tournaments first.
                    </p>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setCreateDialogOpen(false);
                    createTeamForm.reset();
                    setLogoFile(null);
                    setLogoPreview(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={
                    createTeamMutation.isPending || 
                    uploadLogoMutation.isPending
                  }
                >
                  {createTeamMutation.isPending || uploadLogoMutation.isPending ? 
                    'Creating...' : 'Create Team'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Team Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this team? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteTeam}
              disabled={deleteTeamMutation.isPending}
            >
              {deleteTeamMutation.isPending ? 'Deleting...' : 'Delete Team'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageTeams;