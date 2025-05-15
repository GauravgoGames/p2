
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function ManagePolls() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');

  const { data: teams } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const res = await fetch('/api/teams');
      if (!res.ok) throw new Error('Failed to fetch teams');
      return res.json();
    }
  });

  const { data: polls } = useQuery({
    queryKey: ['/api/polls'],
    queryFn: async () => {
      const res = await fetch('/api/polls');
      if (!res.ok) throw new Error('Failed to fetch polls');
      return res.json();
    }
  });

  const createPollMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create poll');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/polls'] });
      toast({ title: 'Poll created successfully' });
      setTitle('');
      setTeam1Id('');
      setTeam2Id('');
    }
  });

  const handleCreatePoll = () => {
    createPollMutation.mutate({
      title,
      team1Id: parseInt(team1Id),
      team2Id: parseInt(team2Id)
    });
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Manage Polls</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create New Poll</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Poll Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter poll title"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Team 1</label>
                <select 
                  className="w-full rounded-md border border-input px-3 py-2"
                  value={team1Id}
                  onChange={(e) => setTeam1Id(e.target.value)}
                >
                  <option value="">Select Team 1</option>
                  {teams?.map((team: any) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Team 2</label>
                <select
                  className="w-full rounded-md border border-input px-3 py-2"
                  value={team2Id}
                  onChange={(e) => setTeam2Id(e.target.value)}
                >
                  <option value="">Select Team 2</option>
                  {teams?.map((team: any) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <Button onClick={handleCreatePoll}>Create Poll</Button>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-4">Active Polls</h2>
      <div className="grid gap-4">
        {polls?.map((poll: any) => (
          <Card key={poll.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{poll.title}</h3>
                  <p className="text-sm text-neutral-500">
                    {poll.team1?.name} vs {poll.team2?.name}
                  </p>
                </div>
                <Button variant="destructive" onClick={() => {}}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
