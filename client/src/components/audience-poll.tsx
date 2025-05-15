
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Poll, Team } from '@shared/schema';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface PollProps {
  poll: Poll & {
    team1: Team;
    team2: Team;
    votes: {
      team1Count: number;
      team2Count: number;
    };
  };
}

export default function AudiencePoll({ poll }: PollProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

  const totalVotes = poll.votes.team1Count + poll.votes.team2Count;
  const team1Percentage = totalVotes ? Math.round((poll.votes.team1Count / totalVotes) * 100) : 0;
  const team2Percentage = totalVotes ? Math.round((poll.votes.team2Count / totalVotes) * 100) : 0;

  const voteMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId })
      });
      if (!res.ok) throw new Error('Failed to submit vote');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      toast({ title: 'Vote submitted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to submit vote', variant: 'destructive' });
    }
  });

  const handleVote = (teamId: number) => {
    if (selectedTeam === null) {
      setSelectedTeam(teamId);
      voteMutation.mutate(teamId);
    }
  };

  return (
    <div className="bg-card rounded-xl shadow p-6">
      <h3 className="text-xl font-bold mb-4">{poll.title}</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => handleVote(poll.team1Id)}
            disabled={selectedTeam !== null}
            variant={selectedTeam === poll.team1Id ? "secondary" : "outline"}
            className="h-auto py-4"
          >
            <div className="text-left">
              <p className="font-semibold">{poll.team1.name}</p>
              <p className="text-sm text-muted-foreground">{poll.votes.team1Count} votes</p>
            </div>
          </Button>

          <Button
            onClick={() => handleVote(poll.team2Id)}
            disabled={selectedTeam !== null}
            variant={selectedTeam === poll.team2Id ? "secondary" : "outline"}
            className="h-auto py-4"
          >
            <div className="text-left">
              <p className="font-semibold">{poll.team2.name}</p>
              <p className="text-sm text-muted-foreground">{poll.votes.team2Count} votes</p>
            </div>
          </Button>
        </div>

        <div className="space-y-2">
          <Progress value={team1Percentage} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{team1Percentage}%</span>
            <span>{team2Percentage}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
