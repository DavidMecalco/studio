

"use client"; 

import { useEffect, useState, type ChangeEvent }  from 'react';
import { useParams } from 'next/navigation'; 
import { getJiraTicket, type JiraTicket } from '@/services/jira';
import { getGitHubCommits, type GitHubCommit } from '@/services/github';
import { getUsers, type UserDoc as ServiceUser } from '@/services/users'; 
import { CommitList } from '@/components/github/commit-list';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Ticket as TicketIcon, Github as GithubIcon, User as UserIconLucide, GitBranch, AlertTriangle, HardDriveUpload, FileClock, History, FileDiff, MessageSquare, Paperclip, UploadCloud, Loader2, XIcon, FileText, Tag } from 'lucide-react'; // Added Tag icon
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { CommitChangesForm } from '@/components/tickets/commit-changes-form';
import { Skeleton } from '@/components/ui/skeleton';
import { TicketHistoryList } from '@/components/tickets/ticket-history-list';
import { CommentForm } from '@/components/tickets/CommentForm';
import { useToast } from '@/hooks/use-toast';
import { TicketAdminActions } from '@/components/tickets/ticket-admin-actions'; 


interface TicketDetailsData {
  ticket: JiraTicket;
  commits: GitHubCommit[];
  users: ServiceUser[]; 
}


async function fetchTicketDetails(ticketId: string): Promise<TicketDetailsData | null> {
  try {
    const ticket = await getJiraTicket(ticketId);
    if (!ticket) {
      return null;
    }
    const [commits, users] = await Promise.all([
        getGitHubCommits(ticket.id),
        getUsers() 
    ]);
    return { ticket, commits, users };
  } catch (error) {
    console.error("Error fetching ticket details:", error);
    return null;
  }
}


export default function TicketDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams<{ ticketId: string }>(); 
  const ticketId = params?.ticketId;


  const [ticketData, setTicketData] = useState<TicketDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTicketData = () => {
    if (ticketId) {
        fetchTicketDetails(ticketId)
            .then(data => setTicketData(data))
            .catch(error => console.error("Failed to refresh ticket data:", error));
    }
  };

  useEffect(() => {
    if (ticketId) { 
      setIsLoading(true);
      fetchTicketDetails(ticketId) 
        .then(data => {
          setTicketData(data);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    } else {
        setIsLoading(false);
    }
  }, [ticketId]); 


  if (authLoading || isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-32 mb-4" /> 
        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
              <div className="flex-1">
                <Skeleton className="h-7 w-3/4 mb-1" /> 
                <Skeleton className="h-4 w-1/2" /> 
              </div>
              <div className="flex flex-col sm:items-end gap-2 mt-2 sm:mt-0">
                <Skeleton className="h-7 w-24" /> 
                <Skeleton className="h-5 w-20" /> 
                <Skeleton className="h-5 w-28" /> {/* Placeholder for type */}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <div key={`skel-info-${i}`}><Skeleton className="h-4 w-1/3 mb-1" /><Skeleton className="h-5 w-2/3" /></div>)}
            </div>
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-6 w-1/4 mb-2" /> 
            <Skeleton className="h-16 w-full" /> 
            
            <Skeleton className="h-px w-full my-3" /> 
            <Skeleton className="h-6 w-1/3 mb-2" /> 
            <Skeleton className="h-40 w-full" /> 
            
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-6 w-1/3 mb-2" /> 
            <Skeleton className="h-20 w-full" /> 
             <Skeleton className="h-px w-full" />
            <Skeleton className="h-6 w-1/3 mb-2" /> 
            <Skeleton className="h-24 w-full" /> 
             <Skeleton className="h-px w-full" />
            <Skeleton className="h-6 w-1/3 mb-2" /> 
            <Skeleton className="h-32 w-full" /> 
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ticketData || !ticketData.ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Ticket Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The ticket with ID <span className="font-mono">{ticketId}</span> could not be found.
        </p>
        <Button asChild>
          <Link href={user?.role === 'client' ? "/my-tickets" : "/jira"}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back to Tickets
          </Link>
        </Button>
      </div>
    );
  }

  const { ticket, commits, users: allUsers } = ticketData;

  const canManageTicketCommits = user?.role === 'admin'; 
  const canManageTicketAdminActions = user?.role === 'admin' || user?.role === 'superuser';
  const canInteractWithTicket = !!user; 


  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="outline" size="sm" className="mb-4">
          <Link href={user?.role === 'client' ? "/my-tickets" : "/jira"} className="flex items-center gap-1">
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
                  variant={ticket.status === 'Resuelto' || ticket.status === 'Cerrado' ? 'default' : 'secondary'}
                  className={`text-sm px-3 py-1 ${
                    ticket.status === 'Abierto' ? 'bg-blue-100 text-blue-800' :
                    ticket.status === 'En Progreso' ? 'bg-yellow-100 text-yellow-800' :
                    ticket.status === 'Pendiente' ? 'bg-orange-100 text-orange-800' :
                    ticket.status === 'Reabierto' ? 'bg-cyan-100 text-cyan-800' : 
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
                <Badge variant="outline" className="text-xs px-2 py-0.5 flex items-center gap-1">
                    <Tag className="h-3 w-3"/> Type: {ticket.type}
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
                        {ticket.gitlabRepository ? 
                            <Link href={`https://gitlab.com/${ticket.gitlabRepository}`} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                <GitBranch className="h-4 w-4"/>{ticket.gitlabRepository}
                            </Link> 
                            : '-'}
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
                 {ticket.assigneeId && ( 
                     <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Assigned To</h3>
                        <p className="text-foreground">{allUsers.find(u => u.id === ticket.assigneeId)?.name || ticket.assigneeId}</p> 
                    </div>
                 )}
            </div>
            
            <Separator className="my-4"/>

            <h3 className="text-lg font-semibold mb-2 text-foreground">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap mb-6">
              {ticket.description}
            </p>
            
            {canManageTicketAdminActions && allUsers.length > 0 && (
                <>
                    <Separator className="my-6"/>
                    <TicketAdminActions ticket={ticket} users={allUsers} onTicketUpdate={refreshTicketData} />
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

            <Separator className="my-6"/>
             <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
                <History className="h-5 w-5"/> Historial del Ticket
            </h3>
            <TicketHistoryList history={ticket.history} title="" />
           
            {canInteractWithTicket && ticketId && ( 
                <>
                    <Separator className="my-6"/>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
                        <MessageSquare className="h-5 w-5"/> Comentarios
                    </h3>
                    <CommentForm ticketId={ticketId} /> 
                </>
            )}
           
          </CardContent>
           <CardFooter className="text-xs text-muted-foreground">
             Ticket ID: {ticket.id}
           </CardFooter>
        </Card>
      </div>
      
      {canManageTicketCommits && ticketId && ticketData?.ticket && (
        <>
            <Separator className="my-8" />
            <CommitChangesForm ticketId={ticketId} currentTicketStatus={ticketData.ticket.status} />
        </>
      )}
    </div>
  );
}
