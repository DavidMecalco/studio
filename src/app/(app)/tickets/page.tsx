
"use client"; 

import { useEffect, useState, useMemo } from 'react';
import { TicketList } from '@/components/tickets/ticket-list';
import { getTickets, type Ticket as LocalTicket } from '@/services/tickets'; 
import { getUsers, type UserDoc as ServiceUser, getOrganizations, type Organization } from '@/services/users';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Ticket as TicketIconLucide, AlertTriangle } from 'lucide-react'; 
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminTicketFilterBar, type AdminTicketFilters, UNASSIGNED_ASSIGNEE_FILTER_VALUE } from '@/components/tickets/admin-ticket-filter-bar';
import { format, parseISO, isWithinInterval } from 'date-fns'; 

export default function TicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const [allTickets, setAllTickets] = useState<LocalTicket[]>([]);
  const [usersForFilter, setUsersForFilter] = useState<ServiceUser[]>([]);
  const [organizationsForFilter, setOrganizationsForFilter] = useState<Organization[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true); 

  const [filters, setFilters] = useState<AdminTicketFilters>({
    dateFrom: '', 
    dateTo: '', 
    status: 'all',
    priority: 'all',
    type: 'all',
    assigneeId: 'all', 
    requestingClient: 'all',
    searchTerm: '',
  });

  const canViewPage = user?.role === 'admin' || user?.role === 'superuser';

  useEffect(() => {
    async function fetchPageData() {
      if (authLoading || !canViewPage || !user) { 
        setIsPageLoading(false);
        return;
      }
      setIsPageLoading(true);
      try {
        const [tickets, fetchedUsers, fetchedOrgs] = await Promise.all([
            getTickets(), 
            getUsers(),
            getOrganizations()
        ]);
        setAllTickets(tickets);
        setUsersForFilter(fetchedUsers);
        setOrganizationsForFilter(fetchedOrgs);
      } catch (error) {
        console.error("Error fetching data for Tickets page:", error);
      }
      setIsPageLoading(false);
    }
    if (canViewPage && !authLoading && user) { 
      fetchPageData();
    } else if (!authLoading) {
      setIsPageLoading(false); 
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
      if (filters.type !== 'all' && ticket.type !== filters.type) return false;
      
      if (filters.assigneeId !== 'all') {
        if (filters.assigneeId === UNASSIGNED_ASSIGNEE_FILTER_VALUE) {
          if (ticket.assigneeId !== undefined && ticket.assigneeId !== null && ticket.assigneeId !== '') return false;
        } else {
          if (ticket.assigneeId !== filters.assigneeId) return false;
        }
      }

      if (filters.requestingClient !== 'all' && ticket.provider !== filters.requestingClient) return false;
      
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const searchableContent = [
          ticket.id,
          ticket.title,
          ticket.description,
          ticket.type,
          ticket.assigneeId || '', 
          ticket.requestingUserId,
          ticket.provider || '', 
          ticket.branch || '' 
        ].join(' ').toLowerCase();
        if (!searchableContent.includes(term)) return false;
      }
      return true;
    });
  }, [allTickets, filters]);


  if (authLoading || (isPageLoading && canViewPage)) { 
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
         <Card className="shadow-lg rounded-xl"><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 items-end">{[...Array(7)].map((_, i) => <Skeleton key={`filter-skel-${i}`} className="h-10 w-full" />)}</div> <div className="md:col-span-2 lg:col-span-3 xl:col-span-full"><Skeleton className="h-10 w-full" /></div> <Skeleton className="h-10 w-36" /></CardContent></Card>
        <Card className="bg-card shadow-xl rounded-xl">
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={`list-skel-${i}`} className="h-12 w-full" />)}
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
            <p className="text-muted-foreground">This page is for admin or superuser users only.</p>
        </div>
     )
  }

  const viewTitle = user?.role === 'admin' ? 'Admin/Technician View' : 'Super User View';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TicketIconLucide className="h-8 w-8 text-primary" /> Gestión de Tickets ({viewTitle})
          </h1>
          <p className="text-muted-foreground">
            Rastree y gestione las últimas actualizaciones y problemas. {user?.role === 'admin' ? 'Los técnicos pueden ver los tickets asignados y gestionar el desarrollo.' : 'Los superusuarios pueden supervisar todos los tickets, incluidos los no asignados, y asignarlos a los técnicos.'}
          </p>
        </div>
      </div>

      <AdminTicketFilterBar 
        filters={filters}
        onFiltersChange={setFilters}
        users={usersForFilter}
        organizations={organizationsForFilter.map(org => org.name)} 
      />

      <Card className="bg-card shadow-xl rounded-xl border-border">
        <CardHeader>
          <CardTitle>
            Todos los Tickets 
          </CardTitle>
          <CardDescription>
            Navegue y gestione todos los tickets disponibles. Haga clic en 'Ver' para ver detalles y gestionar el desarrollo. Los superusuarios pueden asignar tickets no asignados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TicketList 
            tickets={filteredTickets} 
            title="" 
            showRequestingUser={true} 
            showAssignee={true} 
            onTicketActionSuccess={() => { // Refresh data on action
                if (canViewPage && user) {
                    setIsPageLoading(true);
                    Promise.all([getTickets(), getUsers(), getOrganizations()])
                        .then(([tickets, fetchedUsers, fetchedOrgs]) => {
                            setAllTickets(tickets);
                            setUsersForFilter(fetchedUsers);
                            setOrganizationsForFilter(fetchedOrgs);
                        })
                        .catch(error => console.error("Error refetching data for Tickets page:", error))
                        .finally(() => setIsPageLoading(false));
                }
            }}
            />
        </CardContent>
      </Card>
    </div>
  );
}
