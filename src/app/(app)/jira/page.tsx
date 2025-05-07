
import { TicketList } from '@/components/tickets/ticket-list';
import { getJiraTickets, type JiraTicket } from '@/services/jira';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Ticket } from 'lucide-react';

async function getPageData() {
  const jiraTickets: JiraTicket[] = await getJiraTickets();
  return { jiraTickets };
}

export default async function JiraPage() {
  const { jiraTickets } = await getPageData();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Ticket className="h-8 w-8 text-primary" /> Jira Tickets
          </h1>
          <p className="text-muted-foreground">
            Track the latest updates and issues from Jira.
          </p>
        </div>
      </div>

      <Card className="bg-card shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle>All Jira Tickets</CardTitle>
          <CardDescription>Browse and manage all available Jira tickets.</CardDescription>
        </CardHeader>
        <CardContent>
          <TicketList tickets={jiraTickets} title="" />
        </CardContent>
      </Card>
    </div>
  );
}
