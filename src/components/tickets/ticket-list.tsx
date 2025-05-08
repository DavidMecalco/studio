
"use client";

import { useState } from 'react';
import type { Ticket as LocalTicket, TicketStatus } from '@/services/tickets'; // Updated import
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowRight, Ticket as TicketIcon, GitBranch, User, RotateCcw, Loader2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { updateTicketAction } from '@/app/actions/ticket-actions'; // Updated import

interface TicketListProps {
  tickets: LocalTicket[]; // Updated type
  title?: string;
  maxItems?: number;
  showRequestingUser?: boolean; 
  showAssignee?: boolean; 
  onTicketActionSuccess?: () => void; 
  isClientView?: boolean; 
}

export function TicketList({ 
    tickets, 
    title = "Tickets", // Updated default title
    maxItems, 
    showRequestingUser = true,
    showAssignee = false,
    onTicketActionSuccess,
    isClientView = false,
}: TicketListProps) {
  const displayedTickets = maxItems ? tickets.slice(0, maxItems) : tickets;
  const { user } = useAuth();
  const { toast } = useToast();
  const [reopeningTicketId, setReopeningTicketId] = useState<string | null>(null);

  const handleReopenTicket = async (ticketId: string) => {
    if (!user) {
        toast({ title: "Error", description: "Debe iniciar sesión para reabrir un ticket.", variant: "destructive"});
        return;
    }
    setReopeningTicketId(ticketId);
    const result = await updateTicketAction(ticketId, user.id, {newStatus: 'Reabierto', comment: 'Ticket reabierto por el cliente.'}); // Use updateTicketAction
    if (result.success) {
        toast({ title: "Ticket Reabierto", description: `El ticket ${ticketId} ha sido reabierto.` });
        if (onTicketActionSuccess) {
            onTicketActionSuccess();
        }
    } else {
        toast({ title: "Error", description: result.error || "No se pudo reabrir el ticket.", variant: "destructive"});
    }
    setReopeningTicketId(null);
  };


  if (!displayedTickets.length) {
    return (
      <Card>
        {title && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TicketIcon className="h-5 w-5" /> {title}</CardTitle>
        </CardHeader>
        )}
        <CardContent>
          <p className="text-muted-foreground">No tickets found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {title && (
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TicketIcon className="h-5 w-5" /> {title}</CardTitle>
      </CardHeader>
      )}
      <CardContent className={!title ? "pt-6" : ""}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              {showRequestingUser && <TableHead>Requesting User</TableHead>}
              {showAssignee && <TableHead>Assigned To</TableHead>}
              <TableHead>Repository</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedTickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium">{ticket.id}</TableCell>
                <TableCell>{ticket.title}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Tag className="h-3 w-3"/>
                    {ticket.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={ticket.status === 'Resuelto' || ticket.status === 'Cerrado' ? 'default' : 'secondary'}
                    className={
                        ticket.status === 'Abierto' ? 'bg-blue-100 text-blue-800' :
                        ticket.status === 'En Progreso' ? 'bg-yellow-100 text-yellow-800' :
                        ticket.status === 'Pendiente' ? 'bg-orange-100 text-orange-800' :
                        ticket.status === 'Reabierto' ? 'bg-cyan-100 text-cyan-800' : 
                        ticket.status === 'En espera del visto bueno' ? 'bg-purple-100 text-purple-800' :
                        (ticket.status === 'Resuelto' || ticket.status === 'Cerrado') ? 'bg-green-100 text-green-800' : ''
                    }
                  >
                    {ticket.status}
                  </Badge>
                </TableCell>
                <TableCell>
                   <Badge 
                    variant={ticket.priority === 'Alta' ? 'destructive' : ticket.priority === 'Media' ? 'secondary' : 'outline'}
                    className={
                        ticket.priority === 'Alta' ? 'bg-red-100 text-red-800 border-red-300' :
                        ticket.priority === 'Media' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                        'bg-gray-100 text-gray-800 border-gray-300'
                    }
                   >
                    {ticket.priority}
                   </Badge>
                </TableCell>
                {showRequestingUser && <TableCell>{ticket.requestingUserId}</TableCell>}
                {showAssignee && (
                  <TableCell>
                    {ticket.assigneeId ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" /> {ticket.assigneeId}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                )}
                <TableCell>
                  {ticket.githubRepository ? ( // Changed from gitlabRepository
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <GitBranch className="h-3 w-3" /> {ticket.githubRepository}
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/tickets/${ticket.id}`} className="flex items-center gap-1"> {/* Updated path */}
                      View <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  {isClientView && (ticket.status === 'Cerrado' || ticket.status === 'Resuelto') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReopenTicket(ticket.id)}
                      disabled={reopeningTicketId === ticket.id}
                      className="text-xs"
                    >
                      {reopeningTicketId === ticket.id ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <RotateCcw className="mr-1 h-3 w-3" />
                      )}
                      Reabrir
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

