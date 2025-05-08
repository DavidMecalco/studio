
"use client"; 

import { useEffect, useState, useMemo } from 'react';
import { TicketList } from '@/components/tickets/ticket-list';
import { getJiraTickets, type JiraTicket, type JiraTicketStatus, type JiraTicketPriority } from '@/services/jira';
import { getUsers, type UserDoc as ServiceUser, getOrganizations, type Organization } from '@/services/users';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Ticket, Users, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminTicketFilterBar, type AdminTicketFilters } from '@/components/tickets/admin-ticket-filter-bar';
import { format, parseISO, isWithinInterval, subDays } from 'date-fns';

export default function JiraPage() {
  const { user, loading: authLoading } = useAuth();
  const [allTickets, setAllTickets] = useState<JiraTicket[]>([]);
  const [usersForFilter, setUsersForFilter] = useState<ServiceUser[]>([]);
  const [organizationsForFilter, setOrganizationsForFilter] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState<AdminTicketFilters>({
    dateFrom: '', 
    dateTo: '', 
    status: 'all',
    priority: 'all',
    assigneeId: 'all',
    requestingClient: 'all',
    searchTerm: '',
  });

  const canViewPage = user?.role === 'admin' || user?.role === 'superuser';

  useEffect(() => {
    async function fetchPageData() {
      if (authLoading || !canViewPage) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [tickets, fetchedUsers, fetchedOrgs] = await Promise.all([
            getJiraTickets(),
            getUsers(),
            getOrganizations()
        ]);
        setAllTickets(tickets);
        setUsersForFilter(fetchedUsers);
        setOrganizationsForFilter(fetchedOrgs);
      } catch (error) {
        console.error("Error fetching data for Jira page:", error);
        // Optionally show a toast message for error
      }
      setIsLoading(false);
    }
    if (canViewPage) {
      fetchPageData();
    } else if (!authLoading) {
      setIsLoading(false); 
    }
  }, [user, authLoading, canViewPage]);

  const filteredTickets = useMemo(() => {
    if (!allTickets) return [];
    return allTickets.filter(ticket => {
      const ticketDate = ticket.lastUpdated ? parseISO(ticket.lastUpdated) : (ticket.history.length > 0 ? parseISO(ticket.history[0].timestamp) : new Date(0));
      
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
      if (filters.assigneeId !== 'all' && ticket.assigneeId !== filters.assigneeId) return false;
      if (filters.requestingClient !== 'all' && ticket.provider !== filters.requestingClient) return false;
      
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const searchableContent = [
          ticket.id,
          ticket.title,
          ticket.description,
          ticket.assigneeId,
          ticket.requestingUserId,
          ticket.provider,
          ticket.branch
        ].join(' ').toLowerCase();
        if (!searchableContent.includes(term)) return false;
      }
      return true;
    });
  }, [allTickets, filters]);


  if (authLoading || (isLoading && canViewPage)) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Skeleton className="h-8 w-3/4 mb-1" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
         <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(5)].map((_, i) => <Skeleton key={`filter-skel-${i}`} className="h-10 w-full" />)}</div><Skeleton className="h-10 w-32" /></CardContent></Card>
        <Card className="bg-card shadow-lg rounded-xl">
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={`list-skel-${i}`} className="h-10 w-full" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!canViewPage && !authLoading) { 
     return (
        <div className="space-y-8 text-center py-10">
            <AlertTriangle className="h-16 w-16 mx-auto text-destructive" />
            <h1 className="text-2xl font-semibold">Access Denied</h1>
            <p className="text-muted-foreground">This page is for admin or superuser users only.</p>
        </div>
     )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Ticket className="h-8 w-8 text-primary" /> Jira Tickets ({user?.role === 'admin' ? 'Admin/Technician' : 'Super User'} View)
          </h1>
          <p className="text-muted-foreground">
            Track and manage latest updates and issues from Jira. {user?.role === 'admin' ? 'Technicians can view assigned tickets and manage development.' : 'Super users can oversee all tickets.'}
          </p>
        </div>
      </div>

      <AdminTicketFilterBar 
        filters={filters}
        onFiltersChange={setFilters}
        users={usersForFilter}
        organizations={organizationsForFilter.map(org => org.name)} // Pass organization names
      />

      <Card className="bg-card shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle>
            All Jira Tickets 
          </CardTitle>
          <CardDescription>
            Browse and manage all available Jira tickets. Click 'View' to see details and manage development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TicketList 
            tickets={filteredTickets} 
            title="" 
            showRequestingUser={true} 
            showAssignee={true}
            />
        </CardContent>
      </Card>
    </div>
  );
}

