
"use client"; // Required because we use useAuth hook

import { useEffect, useState } from 'react';
import { TicketList } from '@/components/tickets/ticket-list';
import { getJiraTickets, type JiraTicket } from '@/services/jira';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ListChecks, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyTicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const canViewPage = user?.role === 'client';

  useEffect(() => {
    async function fetchTickets() {
      if (authLoading || !canViewPage) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const userTickets = await getJiraTickets(user!.id); // User is guaranteed by canViewPage
      setTickets(userTickets);
      setIsLoading(false);
    }

    if (canViewPage) {
      fetchTickets();
    } else if (!authLoading) {
      setIsLoading(false); // User cannot view, stop loading
    }
  }, [user, authLoading, canViewPage]);

  if (authLoading || (isLoading && canViewPage)) {
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

  if (!canViewPage && !authLoading) { // Check after auth loading is complete
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
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

      <Card className="bg-card shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle>Your Submitted Tickets</CardTitle>
          <CardDescription>Below is a list of tickets you have created.</CardDescription>
        </CardHeader>
        <CardContent>
          <TicketList tickets={tickets} title="" showRequestingUser={false} />
        </CardContent>
      </Card>
    </div>
  );
}

