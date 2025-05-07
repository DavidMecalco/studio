
import { getJiraTicket, getJiraTickets, type JiraTicket } from '@/services/jira';
import { getGitHubCommits, type GitHubCommit } from '@/services/github';
import { CommitList } from '@/components/github/commit-list';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Ticket as TicketIcon, Github as GithubIcon, User as UserIconLucide, GitBranch, AlertTriangle } from 'lucide-react'; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format, parseISO } from 'date-fns';

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
  // Assuming ticket.id or some other property can be used to find related commits
  const commits = await getGitHubCommits(ticket.id); 
  return { ticket, commits };
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const ticketData = await getTicketDetails(params.ticketId);

  if (!ticketData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
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
            <ArrowLeft className="h-4 w-4" /> Back to Tickets
          </Link>
        </Button>
        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <TicketIcon className="h-6 w-6 text-primary" /> {ticket.title}
                </CardTitle>
                <CardDescription className="mt-1">
                  Ticket ID: <span className="font-mono">{ticket.id}</span>
                </CardDescription>
              </div>
              <div className="flex flex-col sm:items-end gap-2 mt-2 sm:mt-0">
                <Badge 
                  variant={ticket.status === 'Resolved' || ticket.status === 'Cerrado' ? 'default' : 'secondary'}
                  className={`text-sm px-3 py-1 ${
                    ticket.status === 'Abierto' ? 'bg-blue-100 text-blue-800' :
                    ticket.status === 'En Progreso' ? 'bg-yellow-100 text-yellow-800' :
                    ticket.status === 'Pendiente' ? 'bg-orange-100 text-orange-800' :
                    ticket.status === 'En espera del visto bueno' ? 'bg-purple-100 text-purple-800' :
                    (ticket.status === 'Resuelto' || ticket.status === 'Cerrado') ? 'bg-green-100 text-green-800' : ''
                  }`}
                >
                  {ticket.status}
                </Badge>
                 <Badge
                    variant={ticket.priority === 'Alta' ? 'destructive' : ticket.priority === 'Media' ? 'secondary' : 'outline'}
                    className={`text-xs px-2 py-0.5 ${
                        ticket.priority === 'Alta' ? 'bg-red-100 text-red-800 border-red-300' :
                        ticket.priority === 'Media' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                        'bg-gray-100 text-gray-800 border-gray-300'
                    }`}
                >
                    Priority: {ticket.priority}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Requesting User</h3>
                    <p className="text-foreground flex items-center gap-1"><UserIconLucide className="h-4 w-4"/>{ticket.requestingUserId}</p>
                </div>
                 <div>
                    <h3 className="text-sm font-medium text-muted-foreground">GitLab Repository</h3>
                    <p className="text-foreground flex items-center gap-1">
                        {ticket.gitlabRepository ? <><GitBranch className="h-4 w-4"/>{ticket.gitlabRepository}</> : '-'}
                    </p>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                    <p className="text-foreground">
                        {ticket.lastUpdated ? format(parseISO(ticket.lastUpdated), "PPP p") : '-'}
                    </p>
                </div>
                {ticket.provider && (
                     <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Provider</h3>
                        <p className="text-foreground">{ticket.provider}</p>
                    </div>
                )}
                {ticket.branch && (
                     <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Branch</h3>
                        <p className="text-foreground">{ticket.branch}</p>
                    </div>
                )}
                 {ticket.assigneeId && ( // Assuming you might fetch assignee details later
                     <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Assigned To</h3>
                        <p className="text-foreground">{ticket.assigneeId}</p>
                    </div>
                 )}
            </div>
            
            <Separator className="my-4"/>

            <h3 className="text-lg font-semibold mb-2 text-foreground">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap mb-6">
              {ticket.description}
            </p>

            {ticket.attachmentNames && ticket.attachmentNames.length > 0 && (
              <>
                <Separator className="my-6" />
                <h3 className="text-lg font-semibold mb-3 text-foreground">Attachments</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {ticket.attachmentNames.map((name, index) => <li key={index}>{name}</li>)}
                </ul>
              </>
            )}
            
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
           <CardFooter className="text-xs text-muted-foreground">
             Ticket ID: {ticket.id}
           </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const tickets = await getJiraTickets(); // Get all tickets for param generation
  return tickets.map((ticket) => ({
    ticketId: ticket.id,
  }));
}
