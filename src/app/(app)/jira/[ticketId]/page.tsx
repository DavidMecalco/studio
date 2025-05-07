
import { getJiraTicket, getJiraTickets, type JiraTicket } from '@/services/jira';
import { getGitHubCommits, type GitHubCommit } from '@/services/github';
import { CommitList } from '@/components/github/commit-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Ticket as TicketIcon, Github as GithubIcon } from 'lucide-react'; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface TicketDetailPageProps {
  params: {
    ticketId: string;
  };
}

async function getTicketDetails(ticketId: string) {
  const ticket = await getJiraTicket(ticketId);
  if (!ticket) {
    return null;
  }
  const commits = await getGitHubCommits(ticketId);
  return { ticket, commits };
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const ticketData = await getTicketDetails(params.ticketId);

  if (!ticketData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <TicketIcon className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Ticket Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The ticket with ID <span className="font-mono">{params.ticketId}</span> could not be found.
        </p>
        <Button asChild>
          <Link href="/jira">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back to Jira Tickets
          </Link>
        </Button>
      </div>
    );
  }

  const { ticket, commits } = ticketData;

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="outline" size="sm" className="mb-4">
          <Link href="/jira" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Jira Tickets
          </Link>
        </Button>
        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <TicketIcon className="h-6 w-6 text-primary" /> {ticket.title}
                </CardTitle>
                <CardDescription className="mt-1">
                  Ticket ID: <span className="font-mono">{ticket.id}</span>
                </CardDescription>
              </div>
              <Badge 
                variant={ticket.status === 'Resolved' ? 'default' : 'secondary'}
                className="text-sm px-3 py-1"
              >
                {ticket.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap mb-6">
              {ticket.description}
            </p>
            
            <Separator className="my-6"/>

            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
                <GithubIcon className="h-5 w-5"/> Associated GitHub Commits
            </h3>
            {commits.length > 0 ? (
                 <CommitList commits={commits} title=""/>
            ) : (
                 <p className="text-muted-foreground">No GitHub commits found for this ticket.</p>
            )}
           
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const tickets = await getJiraTickets();
  return tickets.map((ticket) => ({
    ticketId: ticket.id,
  }));
}
