import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Match, Team, insertMatchSchema, updateMatchResultSchema } from '@shared/schema';

// Combined type for a match with teams
type MatchWithTeams = Match & {
  team1: Team;
  team2: Team;
  tossWinner?: Team;
  matchWinner?: Team;
};

// New match form schema
const newMatchSchema = z.object({
  tournamentName: z.string().min(1, "Tournament name is required"),
  team1Id: z.coerce.number().positive("Please select Team 1"),
  team2Id: z.coerce.number().positive("Please select Team 2"),
  location: z.string().min(1, "Location is required"),
  matchDate: z.date({
    required_error: "Match date is required",
  }),
  status: z.enum(['upcoming', 'ongoing', 'completed']).default('upcoming'),
});

// Update match result schema
const updateResultSchema = z.object({
  tossWinnerId: z.coerce.number().positive("Please select the toss winner").optional(),
  matchWinnerId: z.coerce.number().positive("Please select the match winner").optional(),
  team1Score: z.string().optional(),
  team2Score: z.string().optional(),
  resultSummary: z.string().min(1, "Result summary is required").optional(),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'tie', 'void']).default('completed'),
});

const ManageMatches = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchWithTeams | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customTeamDialog, setCustomTeamDialog] = useState(false);
  const [customTeamFor, setCustomTeamFor] = useState<'team1' | 'team2'>('team1');

  // Fetch all matches
  const { data: matches, isLoading: isLoadingMatches } = useQuery<MatchWithTeams[]>({
    queryKey: ['/api/matches'],
    queryFn: async () => {
      const res = await fetch('/api/matches');
      if (!res.ok) throw new Error('Failed to fetch matches');
      return res.json();
    }
  });

  // Fetch all teams for dropdowns
  const { data: teams, isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const res = await fetch('/api/teams');
      if (!res.ok) throw new Error('Failed to fetch teams');
      return res.json();
    }
  });

  // Create match form
  // Custom team form schema
  const customTeamSchema = z.object({
    name: z.string().min(1, "Team name is required"),
  });

  const createMatchForm = useForm<z.infer<typeof newMatchSchema>>({
    resolver: zodResolver(newMatchSchema),
    defaultValues: {
      tournamentName: '',
      location: '',
      status: 'upcoming',
    },
  });

  const customTeamForm = useForm<z.infer<typeof customTeamSchema>>({
    resolver: zodResolver(customTeamSchema),
    defaultValues: {
      name: '',
    },
  });

  // Update match result form
  const updateResultForm = useForm<z.infer<typeof updateResultSchema>>({
    resolver: zodResolver(updateResultSchema),
    defaultValues: {
      status: 'completed',
    },
  });

  // Create match mutation
  const createMatchMutation = useMutation({
    mutationFn: async (data: z.infer<typeof newMatchSchema>) => {
      const res = await apiRequest('POST', '/api/matches', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Match Created',
        description: 'The match has been successfully created',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      setCreateDialogOpen(false);
      createMatchForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create match',
        variant: 'destructive',
      });
    },
  });

  // Update match result mutation
  const updateMatchMutation = useMutation({
    mutationFn: async (data: { id: number; result: z.infer<typeof updateResultSchema> }) => {
      const res = await apiRequest('PATCH', `/api/matches/${data.id}`, data.result);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Match Updated',
        description: 'The match result has been successfully updated',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      setUpdateDialogOpen(false);
      updateResultForm.reset();
      setSelectedMatch(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update match',
        variant: 'destructive',
      });
    },
  });

  // Create custom team mutation
  const createCustomTeamMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest('POST', '/api/teams', {
        name,
        isCustom: true,
      });
      return res.json();
    },
    onSuccess: (team) => {
      toast({
        title: 'Custom Team Created',
        description: `${team.name} has been successfully created`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      setCustomTeamDialog(false);
      customTeamForm.reset();

      // Set the newly created team in the appropriate field
      if (customTeamFor === 'team1') {
        createMatchForm.setValue('team1Id', team.id);
      } else {
        createMatchForm.setValue('team2Id', team.id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create custom team',
        variant: 'destructive',
      });
    },
  });

  // Delete match mutation
  const deleteMatchMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/matches/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Match Deleted',
        description: 'The match has been successfully deleted',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      setDeleteDialogOpen(false);
      setSelectedMatch(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete match',
        variant: 'destructive',
      });
    },
  });

  // Form submission handlers
  const onCreateMatchSubmit = (data: z.infer<typeof newMatchSchema>) => {
    createMatchMutation.mutate(data);
  };

  const onCustomTeamSubmit = (data: z.infer<typeof customTeamSchema>) => {
    createCustomTeamMutation.mutate(data.name);
  };

  const handleTeamSelectChange = (value: string, fieldName: 'team1Id' | 'team2Id') => {
    if (value === 'custom') {
      setCustomTeamFor(fieldName === 'team1Id' ? 'team1' : 'team2');
      setCustomTeamDialog(true);
    } else {
      createMatchForm.setValue(fieldName, Number(value));
    }
  };

  const onUpdateResultSubmit = (data: z.infer<typeof updateResultSchema>) => {
    if (!selectedMatch) return;
    updateMatchMutation.mutate({ id: selectedMatch.id, result: data });
  };

  const handleUpdateMatch = (match: MatchWithTeams) => {
    setSelectedMatch(match);
    updateResultForm.reset({
      tossWinnerId: match.tossWinnerId || undefined,
      matchWinnerId: match.matchWinnerId || undefined,
      team1Score: match.team1Score || '',
      team2Score: match.team2Score || '',
      resultSummary: match.resultSummary || '',
      status: match.status,
    });
    setUpdateDialogOpen(true);
  };

  const handleDeleteMatch = (match: MatchWithTeams) => {
    setSelectedMatch(match);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteMatch = () => {
    if (!selectedMatch) return;
    deleteMatchMutation.mutate(selectedMatch.id);
  };

  // Filter matches by status
  const filteredMatches = matches?.filter(match => {
    if (activeTab === 'all') return true;
    return match.status === activeTab;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-heading">Manage Matches</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Match
        </Button>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Matches</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Match List</CardTitle>
          <CardDescription>
            Manage cricket matches and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMatches ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredMatches && filteredMatches.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tournament</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell className="font-medium">{match.tournamentName}</TableCell>
                      <TableCell>
                        {match.team1.name} vs {match.team2.name}
                      </TableCell>
                      <TableCell>{format(new Date(match.matchDate), 'dd MMM yyyy, HH:mm')}</TableCell>
                      <TableCell>{match.location}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={match.status === 'upcoming' ? 'upcoming' : 
                                 match.status === 'ongoing' ? 'live' : 'completed'}
                        >
                          {match.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleUpdateMatch(match)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                            onClick={() => handleDeleteMatch(match)}
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
              No matches found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Match Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Match</DialogTitle>
            <DialogDescription>
              Add a new cricket match to the system
            </DialogDescription>
          </DialogHeader>

          <Form {...createMatchForm}>
            <form onSubmit={createMatchForm.handleSubmit(onCreateMatchSubmit)} className="space-y-6">
              <FormField
                control={createMatchForm.control}
                name="tournamentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tournament Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. T20 World Cup" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createMatchForm.control}
                  name="team1Id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team 1</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
                        disabled={isLoadingTeams}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teams?.map((team) => (
                            <SelectItem key={team.id} value={team.id.toString()}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createMatchForm.control}
                  name="team2Id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team 2</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
                        disabled={isLoadingTeams}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teams?.map((team) => (
                            <SelectItem key={team.id} value={team.id.toString()}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createMatchForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Melbourne Cricket Ground" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createMatchForm.control}
                name="matchDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Match Date & Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={
                              "w-full pl-3 text-left font-normal"
                            }
                          >
                            {field.value ? (
                              format(field.value, "PPP HH:mm")
                            ) : (
                              <span>Pick a date and time</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                        <div className="p-3 border-t border-border">
                          <Input
                            type="time"
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':').map(Number);
                              const newDate = field.value ? new Date(field.value) : new Date();
                              newDate.setHours(hours || 0);
                              newDate.setMinutes(minutes || 0);
                              field.onChange(newDate);
                            }}
                            defaultValue={field.value ? format(field.value, "HH:mm") : ""}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createMatchForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMatchMutation.isPending}
                >
                  {createMatchMutation.isPending ? 'Creating...' : 'Create Match'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Update Match Result Dialog */}
      {selectedMatch && (
        <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Match Result</DialogTitle>
              <DialogDescription>
                Set the final result for {selectedMatch.team1.name} vs {selectedMatch.team2.name}
              </DialogDescription>
            </DialogHeader>

            <Form {...updateResultForm}>
              <form onSubmit={updateResultForm.handleSubmit(onUpdateResultSubmit)} className="space-y-6">
                <FormField
                control={updateResultForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Status</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value === 'void') {
                          updateResultForm.setValue('tossWinnerId', undefined);
                          updateResultForm.setValue('matchWinnerId', undefined);
                        }
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select match status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="tie">Tie</SelectItem>
                        <SelectItem value="void">Void</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {updateResultForm.watch('status') !== 'void' && (
                <FormField
                  control={updateResultForm.control}
                  name="tossWinnerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Toss Winner</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select toss winner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={selectedMatch.team1Id.toString()}>
                            {selectedMatch.team1.name}
                          </SelectItem>
                          <SelectItem value={selectedMatch.team2Id.toString()}>
                            {selectedMatch.team2.name}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {updateResultForm.watch('status') === 'completed' && (
                <FormField
                  control={updateResultForm.control}
                  name="matchWinnerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Match Winner</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select match winner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={selectedMatch.team1Id.toString()}>
                            {selectedMatch.team1.name}
                          </SelectItem>
                          <SelectItem value={selectedMatch.team2Id.toString()}>
                            {selectedMatch.team2.name}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={updateResultForm.control}
                    name="team1Score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{selectedMatch.team1.name} Score</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 186/4 (20.0)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={updateResultForm.control}
                    name="team2Score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{selectedMatch.team2.name} Score</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 165/9 (20.0)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={updateResultForm.control}
                  name="resultSummary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Result Summary</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. India won by 21 runs" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Brief summary of the match result
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setUpdateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateMatchMutation.isPending}
                  >
                    {updateMatchMutation.isPending ? 'Updating...' : 'Update Result'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Match Confirmation Dialog */}
      {selectedMatch && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Match</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this match? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <p className="font-medium">{selectedMatch.tournamentName}</p>
              <p className="text-neutral-600">
                {selectedMatch.team1.name} vs {selectedMatch.team2.name}
              </p>
              <p className="text-neutral-600">
                {format(new Date(selectedMatch.matchDate), 'dd MMM yyyy, HH:mm')}
              </p>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDeleteMatch}
                disabled={deleteMatchMutation.isPending}
              >
                {deleteMatchMutation.isPending ? 'Deleting...' : 'Delete Match'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Custom Team Dialog */}
      <Dialog open={customTeamDialog} onOpenChange={setCustomTeamDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Custom Team</DialogTitle>
            <DialogDescription>
              Add a custom team for this match
            </DialogDescription>
          </DialogHeader>

          <Form {...customTeamForm}>
            <form onSubmit={customTeamForm.handleSubmit(onCustomTeamSubmit)} className="space-y-6">
              <FormField
                control={customTeamForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Hometown Heroes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCustomTeamDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCustomTeamMutation.isPending}
                >
                  {createCustomTeamMutation.isPending ? 'Creating...' : 'Create Team'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageMatches;