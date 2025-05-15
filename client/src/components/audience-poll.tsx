import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Poll, Team } from '@shared/schema';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

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
      queryClient.invalidateQueries({ queryKey: ['/api/polls'] });
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
          <button
            onClick={() => handleVote(poll.team1Id)}
            disabled={selectedTeam !== null}
            className={`flex items-center gap-3 p-4 rounded-lg border ${
              selectedTeam === poll.team1Id ? 'bg-primary/10 border-primary' : 'hover:border-primary'
            }`}
          >
            <div className="text-left">
              <p className="font-semibold">{poll.team1.name}</p>
              <p className="text-sm text-muted-foreground">{poll.votes.team1Count} votes</p>
            </div>
          </button>

          <button
            onClick={() => handleVote(poll.team2Id)}
            disabled={selectedTeam !== null}
            className={`flex items-center gap-3 p-4 rounded-lg border ${
              selectedTeam === poll.team2Id ? 'bg-primary/10 border-primary' : 'hover:border-primary'
            }`}
          >
            <div className="text-left">
              <p className="font-semibold">{poll.team2.name}</p>
              <p className="text-sm text-muted-foreground">{poll.votes.team2Count} votes</p>
            </div>
          </button>
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