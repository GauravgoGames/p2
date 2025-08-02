import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle, XCircle, MessageCircle, User, AlertTriangle } from "lucide-react";
import { SupportTicket } from "@shared/schema";

export default function AdminSupportPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/admin/tickets"],
    retry: false,
  });

  // Filter tickets based on status
  const filteredTickets = tickets.filter((ticket: SupportTicket) => 
    filterStatus === 'all' || ticket.status === filterStatus
  );

  // Get ticket counts by status
  const getStatusCount = (status: string) => {
    if (status === 'all') return tickets.length;
    return tickets.filter((ticket: SupportTicket) => ticket.status === status).length;
  };

  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, status, assignedToUserId }: { ticketId: number; status: string; assignedToUserId?: number }) => {
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, assignedToUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update ticket");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ticket updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="h-4 w-4" />;
      case 'in-progress':
        return <AlertTriangle className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'closed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading support tickets...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Ticket Management</h1>
        <p className="text-gray-600">Manage and respond to user support tickets</p>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card 
          className={`cursor-pointer transition-colors ${filterStatus === 'all' ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'}`}
          onClick={() => setFilterStatus('all')}
        >
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{getStatusCount('all')}</div>
            <div className="text-sm text-gray-600">All Tickets</div>
          </CardContent>
        </Card>
        
        {(['open', 'in-progress', 'resolved', 'closed'] as const).map((status) => (
          <Card 
            key={status}
            className={`cursor-pointer transition-colors ${filterStatus === status ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'}`}
            onClick={() => setFilterStatus(status)}
          >
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                {getStatusIcon(status)}
              </div>
              <div className="text-2xl font-bold">{getStatusCount(status)}</div>
              <div className="text-sm text-gray-600 capitalize">{status.replace('-', ' ')}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        {filteredTickets && filteredTickets.length > 0 ? (
          filteredTickets.map((ticket: any) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">#{ticket.id} - {ticket.subject}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        User ID: {ticket.userId}
                      </span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                    <Badge className={getStatusColor(ticket.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(ticket.status)}
                        {ticket.status}
                      </span>
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Select
                      value={ticket.status}
                      onValueChange={(value) => updateTicketMutation.mutate({ ticketId: ticket.id, status: value })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Update Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = `/support/ticket/${ticket.id}`}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    View & Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No support tickets</h3>
              <p className="text-gray-600">No support tickets have been created yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}