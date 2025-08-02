import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Match, Team } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Clock, MapPin, Trophy, Users } from 'lucide-react';
import { format } from 'date-fns';

interface UpdateMatchDialogProps {
  match: Match & {
    team1: Team;
    team2: Team;
    tossWinner?: Team;
    matchWinner?: Team;
  };
  open: boolean;
  onClose: () => void;
}

const UpdateMatchDialog = ({ match, open, onClose }: UpdateMatchDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    matchDate: '',
    location: '',
    status: '',
    tossWinnerId: '',
    matchWinnerId: ''
  });

  // Initialize form with current match data
  useEffect(() => {
    if (match && open) {
      const matchDate = new Date(match.matchDate);
      const formattedDate = format(matchDate, "yyyy-MM-dd'T'HH:mm");
      
      setFormData({
        matchDate: formattedDate,
        location: match.location || '',
        status: match.status || 'upcoming',
        tossWinnerId: match.tossWinnerId?.toString() || '',
        matchWinnerId: match.matchWinnerId?.toString() || ''
      });
    }
  }, [match, open]);

  const updateMatchMutation = useMutation({
    mutationFn: async (updateData: {
      matchDate: string;
      location: string;
      status: string;
      tossWinnerId?: number | null;
      matchWinnerId?: number | null;
    }) => {
      const response = await fetch(`/api/matches/${match.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update match');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Match Updated",
        description: "Match details have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update match",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updateData: {
      matchDate: string;
      location: string;
      status: string;
      tossWinnerId?: number | null;
      matchWinnerId?: number | null;
    } = {
      matchDate: new Date(formData.matchDate).toISOString(),
      location: formData.location,
      status: formData.status
    };

    // Only include toss and match winners if they are set
    if (formData.tossWinnerId) {
      updateData.tossWinnerId = parseInt(formData.tossWinnerId);
    }
    if (formData.matchWinnerId) {
      updateData.matchWinnerId = parseInt(formData.matchWinnerId);
    }

    updateMatchMutation.mutate(updateData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-5 w-5 text-primary" />
            Update Match Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Match Info Header */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <img 
                      src={match.team1.logoUrl || 'https://via.placeholder.com/32'} 
                      alt={match.team1.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="font-semibold">{match.team1.name}</span>
                  </div>
                  <span className="text-gray-500 font-bold">VS</span>
                  <div className="flex items-center gap-2">
                    <img 
                      src={match.team2.logoUrl || 'https://via.placeholder.com/32'} 
                      alt={match.team2.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="font-semibold">{match.team2.name}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Match Timing Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Match Timing
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="matchDate" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Match Date & Time
                  </Label>
                  <Input
                    id="matchDate"
                    type="datetime-local"
                    value={formData.matchDate}
                    onChange={(e) => handleInputChange('matchDate', e.target.value)}
                    className="w-full"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Enter match location"
                    className="w-full"
                    required
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Match Status Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Users className="h-5 w-5 text-primary" />
                Match Status
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Current Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select match status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="tie">Tie</SelectItem>
                    <SelectItem value="void">Void</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Match Results Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Trophy className="h-5 w-5 text-primary" />
                Match Results
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tossWinner">Toss Winner (Optional)</Label>
                  <Select value={formData.tossWinnerId} onValueChange={(value) => handleInputChange('tossWinnerId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select toss winner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No toss winner</SelectItem>
                      <SelectItem value={match.team1Id.toString()}>
                        <div className="flex items-center gap-2">
                          <img 
                            src={match.team1.logoUrl || 'https://via.placeholder.com/16'} 
                            alt={match.team1.name}
                            className="w-4 h-4 rounded-full"
                          />
                          {match.team1.name}
                        </div>
                      </SelectItem>
                      <SelectItem value={match.team2Id.toString()}>
                        <div className="flex items-center gap-2">
                          <img 
                            src={match.team2.logoUrl || 'https://via.placeholder.com/16'} 
                            alt={match.team2.name}
                            className="w-4 h-4 rounded-full"
                          />
                          {match.team2.name}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="matchWinner">Match Winner (Optional)</Label>
                  <Select value={formData.matchWinnerId} onValueChange={(value) => handleInputChange('matchWinnerId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select match winner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No match winner</SelectItem>
                      <SelectItem value={match.team1Id.toString()}>
                        <div className="flex items-center gap-2">
                          <img 
                            src={match.team1.logoUrl || 'https://via.placeholder.com/16'} 
                            alt={match.team1.name}
                            className="w-4 h-4 rounded-full"
                          />
                          {match.team1.name}
                        </div>
                      </SelectItem>
                      <SelectItem value={match.team2Id.toString()}>
                        <div className="flex items-center gap-2">
                          <img 
                            src={match.team2.logoUrl || 'https://via.placeholder.com/16'} 
                            alt={match.team2.name}
                            className="w-4 h-4 rounded-full"
                          />
                          {match.team2.name}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateMatchMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMatchMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {updateMatchMutation.isPending ? 'Updating...' : 'Update Match'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateMatchDialog;