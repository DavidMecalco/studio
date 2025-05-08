
"use client"; 

import { useEffect, useState, useMemo } from 'react';
import { TicketList } from '@/components/tickets/ticket-list';
import { getJiraTickets, type JiraTicket, type JiraTicketStatus, type JiraTicketPriority } from '@/services/jira';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ListChecks, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { MyTicketsFilterBar, type MyTicketsFilters } from '@/components/tickets/my-tickets-filter-bar';
import { format, parseISO, isWithinInterval, subDays } from 'date-fns';

export default function MyTicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState<MyTicketsFilters>({
    dateFrom: '', //format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    dateTo: '', //format(new Date(), 'yyyy-MM-dd'),
    status: 'all',
    priority: 'all',
    searchTerm: '',
  });

  const canViewPage = user?.role === 'client';

  const fetchUserTickets = async () => {
      if (!user || !canViewPage) return;
      setIsLoading(true);
      try {
          const userTickets = await getJiraTickets(user.id);
          setTickets(userTickets);
      } catch (error) {
          console.error("Failed to fetch tickets:", error);
          // Optionally show a toast message here
      }
      setIsLoading(false);
  };
  
  useEffect(() => {
    if (canViewPage && user) {
      fetchUserTickets();
    } else if (!authLoading && !canViewPage) {
      setIsLoading(false); 
    }
  }, [user, authLoading, canViewPage]);

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter(ticket => {
      const ticketDate = ticket.lastUpdated ? parseISO(ticket.lastUpdated) : parseISO(ticket.history[0].timestamp);
      
      if (filters.dateFrom && filters.dateTo) {
        const dateFrom = parseISO(filters.dateFrom);
        const dateTo = parseISO(filters.dateTo);
        if (!isWithinInterval(ticketDate, { start: dateFrom, end: dateTo })) return false;
      } else if (filters.dateFrom && ticketDate < parseISO(filters.dateFrom)) {
        return false;
      } else if (filters.dateTo && ticketDate > parseISO(filters.dateTo)) {
        return false;
      }

      if (filters.status !== 'all' && ticket.status !== filters.status) return false;
      if (filters.priority !== 'all' && ticket.priority !== filters.priority) return false;
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        if (!ticket.title.toLowerCase().includes(term) && !ticket.description.toLowerCase().includes(term) && !ticket.id.toLowerCase().includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [tickets, filters]);


  if (authLoading || (isLoading && canViewPage)) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-1" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        {/* Filter bar skeleton */}
        <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div><Skeleton className="h-10 w-32" /></CardContent></Card>
        {/* Ticket list skeleton */}
        <Card className="bg-card shadow-lg rounded-xl">
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canViewPage && !authLoading) { 
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
            <AlertTriangle className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">This page is for client users only.</p>
        </div>
     )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ListChecks className="h-8 w-8 text-primary" /> My Tickets
          </h1>
          <p className="text-muted-foreground">
            View and track your submitted tickets.
          </p>
        </div>
      </div>

      <MyTicketsFilterBar filters={filters} onFiltersChange={setFilters} />

      <Card className="bg-card shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle>Your Submitted Tickets</CardTitle>
          <CardDescription>Below is a list of tickets you have created. You can reopen closed or resolved tickets.</CardDescription>
        </CardHeader>
        <CardContent>
          <TicketList 
            tickets={filteredTickets} 
            title="" 
            showRequestingUser={false} 
            onTicketActionSuccess={fetchUserTickets} // Callback to refresh list
            isClientView={true} // Indicate this is the client's view for reopen button
          />
        </CardContent>
      </Card>
    </div>
  );
}
