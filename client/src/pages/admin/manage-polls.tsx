import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Team } from '@shared/schema';

export default function ManagePolls() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');
  const [completionDate, setCompletionDate] = useState<Date>();

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await fetch('/api/teams');
      if (!res.ok) throw new Error('Failed to fetch teams');
      return res.json();
    }
  });

  const { data: polls, isLoading: isLoadingPolls } = useQuery({
    queryKey: ['/api/polls'],
    queryFn: async () => {
      const res = await fetch('/api/polls');
      if (!res.ok) throw new Error('Failed to fetch polls');
      return res.json();
    }
  });

  const createPollMutation = useMutation({
    mutationFn: async (data: { title: string; team1Id: number; team2Id: number; completionDate: Date }) => {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create poll');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      toast({ title: 'Poll created successfully' });
      setTitle('');
      setTeam1Id('');
      setTeam2Id('');
      setCompletionDate(undefined);
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to create poll',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleCreatePoll = () => {
    if (!title || !team1Id || !team2Id || !completionDate) {
      toast({
        title: 'All fields are required',
        variant: 'destructive'
      });
      return;
    }

    if (team1Id === team2Id) {
      toast({
        title: 'Please select different teams',
        variant: 'destructive'
      });
      return;
    }

    createPollMutation.mutate({
      title,
      team1Id: parseInt(team1Id),
      team2Id: parseInt(team2Id),
      completionDate
    });
  };

  if (!teams || isLoadingPolls) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Manage Polls</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create New Poll</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Poll Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter poll title"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Team 1</label>
                <Select
                  value={team1Id}
                  onValueChange={setTeam1Id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Team 1" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams?.map((team: Team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Team 2</label>
                <Select
                  value={team2Id}
                  onValueChange={setTeam2Id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Team 2" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams?.map((team: Team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Completion Date</label>
              <Calendar
                mode="single"
                selected={completionDate}
                onSelect={setCompletionDate}
                disabled={(date) => date < new Date()}
              />
            </div>

            <Button 
              onClick={handleCreatePoll}
              className="w-full md:w-auto"
              disabled={createPollMutation.isPending}
            >
              {createPollMutation.isPending ? 'Creating...' : 'Create Poll'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">Active Polls</h2>
        {polls?.map((poll: any) => (
          <Card key={poll.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">{poll.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {poll.team1?.name} vs {poll.team2?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ends: {format(new Date(poll.completionDate), 'PPP')}
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => {}}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}