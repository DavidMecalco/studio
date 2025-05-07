
import type { JiraTicket } from '@/services/jira';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowRight, Ticket as TicketIcon } from 'lucide-react'; 
import { Button } from '@/components/ui/button';

interface TicketListProps {
  tickets: JiraTicket[];
  title?: string;
  maxItems?: number;
}

export function TicketList({ tickets, title = "Jira Tickets", maxItems }: TicketListProps) {
  const displayedTickets = maxItems ? tickets.slice(0, maxItems) : tickets;

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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedTickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium">{ticket.id}</TableCell>
                <TableCell>{ticket.title}</TableCell>
                <TableCell>
                  <Badge variant={ticket.status === 'Resolved' ? 'default' : 'secondary'}>
                    {ticket.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/jira/${ticket.id}`} className="flex items-center gap-1">
                      View <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
