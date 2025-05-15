
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Poll, Team } from '@shared/schema';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
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
  const team1Percentage = totalVotes > 0 ? (poll.votes.team1Count / totalVotes) * 100 : 50;
  const team2Percentage = totalVotes > 0 ? (poll.votes.team2Count / totalVotes) * 100 : 50;

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
      toast({
        title: 'Vote Submitted',
        description: 'Your vote has been recorded successfully',
      });
    }
  });

  const handleVote = (teamId: number) => {
    if (selectedTeam === null) {
      setSelectedTeam(teamId);
      voteMutation.mutate(teamId);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-xl font-bold mb-4">{poll.title}</h3>
      
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleVote(poll.team1Id)}
            disabled={selectedTeam !== null}
            className={`flex-1 p-4 rounded-lg border transition-all ${
              selectedTeam === poll.team1Id ? 'bg-primary/10 border-primary' : 'hover:border-primary'
            }`}
          >
            <div className="flex items-center gap-3">
              <img 
                src={poll.team1.logoUrl || 'https://via.placeholder.com/40'} 
                alt={poll.team1.name} 
                className="w-10 h-10 rounded-full"
              />
              <div className="text-left">
                <p className="font-semibold">{poll.team1.name}</p>
                <p className="text-sm text-neutral-500">{poll.votes.team1Count} votes</p>
              </div>
            </div>
          </button>
          
          <span className="text-2xl font-bold text-neutral-300">VS</span>
          
          <button 
            onClick={() => handleVote(poll.team2Id)}
            disabled={selectedTeam !== null}
            className={`flex-1 p-4 rounded-lg border transition-all ${
              selectedTeam === poll.team2Id ? 'bg-primary/10 border-primary' : 'hover:border-primary'
            }`}
          >
            <div className="flex items-center gap-3">
              <img 
                src={poll.team2.logoUrl || 'https://via.placeholder.com/40'} 
                alt={poll.team2.name} 
                className="w-10 h-10 rounded-full"
              />
              <div className="text-left">
                <p className="font-semibold">{poll.team2.name}</p>
                <p className="text-sm text-neutral-500">{poll.votes.team2Count} votes</p>
              </div>
            </div>
          </button>
        </div>
        
        <div className="space-y-2">
          <Progress value={team1Percentage} className="h-2" />
          <div className="flex justify-between text-sm text-neutral-500">
            <span>{team1Percentage.toFixed(1)}%</span>
            <span>{team2Percentage.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
