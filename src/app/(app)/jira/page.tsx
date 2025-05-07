
"use client"; 

import { useEffect, useState } from 'react';
import { TicketList } from '@/components/tickets/ticket-list';
import { getJiraTickets, type JiraTicket } from '@/services/jira';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Ticket, Users, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
// Potentially add a filter component here for technicians to filter by assignee
// import { TicketFilterControls } from '@/components/tickets/ticket-filter-controls'; 

export default function JiraPage() {
  const { user, loading: authLoading } = useAuth();
  const [allTickets, setAllTickets] = useState<JiraTicket[]>([]);
  // const [filteredTickets, setFilteredTickets] = useState<JiraTicket[]>([]); // For future filtering
  const [isLoading, setIsLoading] = useState(true);
  // const [currentFilter, setCurrentFilter] = useState<'all' | 'my-assigned'>('all'); // Example filter state

  const canViewPage = user?.role === 'admin' || user?.role === 'superuser';

  useEffect(() => {
    async function fetchTickets() {
      if (authLoading || !canViewPage) {
        setIsLoading(false);
        return;
      }
       setIsLoading(true);
      const tickets = await getJiraTickets();
      setAllTickets(tickets);
      // setFilteredTickets(tickets); // Initially show all
      setIsLoading(false);
    }
    if (canViewPage) {
      fetchTickets();
    } else if (!authLoading) {
      setIsLoading(false); // User cannot view, stop loading
    }
  }, [user, authLoading, canViewPage]);

  // Example filter logic (can be expanded)
  // useEffect(() => {
  //   if (currentFilter === 'my-assigned' && user) {
  //     setFilteredTickets(allTickets.filter(ticket => ticket.assigneeId === user.id));
  //   } else {
  //     setFilteredTickets(allTickets);
  //   }
  // }, [currentFilter, allTickets, user]);


  if (authLoading || (isLoading && canViewPage)) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Ticket className="h-8 w-8 text-primary" /> Jira Tickets ({user?.role === 'admin' ? 'Admin/Technician' : 'Super User'} View)
            </h1>
            <p className="text-muted-foreground">
              Track and manage latest updates and issues from Jira.
            </p>
          </div>
        </div>
        <Card className="bg-card shadow-lg rounded-xl">
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!canViewPage && !authLoading) { // Check after auth loading is complete
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
        {/* 
        // Future filter controls
        <TicketFilterControls
            currentFilter={currentFilter}
            onFilterChange={setCurrentFilter}
            hasAssignedOption={true} 
        /> 
        */}
      </div>

      <Card className="bg-card shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle>
            {/* {currentFilter === 'my-assigned' ? 'My Assigned Jira Tickets' : 'All Jira Tickets'} */}
            All Jira Tickets 
          </CardTitle>
          <CardDescription>
            {/* {currentFilter === 'my-assigned' ? 'Tickets assigned to you.' : 'Browse and manage all available Jira tickets.'} */}
            Browse and manage all available Jira tickets. Click 'View' to see details and manage development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TicketList 
            tickets={allTickets /* replace with filteredTickets when filter is active */} 
            title="" 
            showRequestingUser={true} 
            showAssignee={true} // New prop to show assignee
            />
        </CardContent>
      </Card>
    </div>
  );
}

