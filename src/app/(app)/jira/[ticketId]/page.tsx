"use client"; 

import { useEffect, useState }  from 'react';
import { useParams } from 'next/navigation'; 
import { getJiraTicket, type JiraTicket } from '@/services/jira';
import { getGitHubCommits, type GitHubCommit } from '@/services/github';
import { CommitList } from '@/components/github/commit-list';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Ticket as TicketIcon, Github as GithubIcon, User as UserIconLucide, GitBranch, AlertTriangle, HardDriveUpload, FileClock, History, FileDiff, MessageSquare } from 'lucide-react'; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { CommitChangesForm } from '@/components/tickets/commit-changes-form';
import { Skeleton } from '@/components/ui/skeleton';
import { TicketHistoryList } from '@/components/tickets/ticket-history-list';
import { FileVersionHistoryDialog } from '@/components/files/file-version-history-dialog';
import { CommentForm } from '@/components/tickets/CommentForm'; // Import the CommentForm

interface TicketDetailsData {
  ticket: JiraTicket;
  commits: GitHubCommit[];
}

// Card for version history of files associated with the ticket
function VersionHistoryCard({ ticketId, files }: { ticketId: string, files?: string[] }) {
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedFileForHistory, setSelectedFileForHistory] = useState<string | null>(null);

  if (!files || files.length === 0) {
    return null; // Don't render card if no files
  }

  const handleShowHistory = (fileName: string) => {
    setSelectedFileForHistory(fileName);
    setIsHistoryDialogOpen(true);
  };

  return (
    <>
      <Card className="shadow-md rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileDiff className="h-5 w-5 text-primary" /> Historial de Versiones de Archivos
          </CardTitle>
          <CardDescription>
            Revise y restaure versiones anteriores de los archivos adjuntos o modificados en este ticket.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {files.map(fileName => (
            <div key={fileName} className="flex justify-between items-center p-3 border rounded-md bg-muted/50">
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                <HardDriveUpload className="h-4 w-4 text-muted-foreground" />
                {fileName}
              </span>
              <Button variant="outline" size="sm" onClick={() => handleShowHistory(fileName)}>
                <History className="mr-2 h-4 w-4" /> Ver Historial
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      {selectedFileForHistory && (
        <FileVersionHistoryDialog
          fileName={selectedFileForHistory}
          isOpen={isHistoryDialogOpen}
          onOpenChange={setIsHistoryDialogOpen}
          ticketId={ticketId}
        />
      )}
    </>
  );
}


async function fetchTicketDetails(ticketId: string): Promise<TicketDetailsData | null> {
  try {
    const ticket = await getJiraTicket(ticketId);
    if (!ticket) {
      return null;
    }
    const commits = await getGitHubCommits(ticket.id);
    return { ticket, commits };
  } catch (error) {
    console.error("Error fetching ticket details:", error);
    return null;
  }
}


export default function TicketDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams<{ ticketId: string }>(); 
  const ticketId = params.ticketId; 

  const [ticketData, setTicketData] = useState<TicketDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Function to re-fetch ticket data, useful after a comment is added or other action
  const refreshTicketData = () => {
    if (ticketId) {
        // Do not set isLoading to true here to avoid full page skeleton on refresh
        fetchTicketDetails(ticketId)
            .then(data => setTicketData(data))
            .catch(error => console.error("Failed to refresh ticket data:", error));
    }
  };


  if (authLoading || isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-32 mb-4" /> {/* Back button */}
        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
              <div className="flex-1">
                <Skeleton className="h-7 w-3/4 mb-1" /> {/* Title */}
                <Skeleton className="h-4 w-1/2" /> {/* Description */}
              </div>
              <div className="flex flex-col sm:items-end gap-2 mt-2 sm:mt-0">
                <Skeleton className="h-7 w-24" /> {/* Status Badge */}
                <Skeleton className="h-5 w-20" /> {/* Priority Badge */}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <div key={i}><Skeleton className="h-4 w-1/3 mb-1" /><Skeleton className="h-5 w-2/3" /></div>)}
            </div>
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-6 w-1/4 mb-2" /> {/* Description heading */}
            <Skeleton className="h-16 w-full" /> {/* Description content */}
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-6 w-1/3 mb-2" /> {/* Commits heading */}
            <Skeleton className="h-20 w-full" /> {/* Commits list placeholder */}
             <Skeleton className="h-px w-full" />
            <Skeleton className="h-6 w-1/3 mb-2" /> {/* History heading */}
            <Skeleton className="h-24 w-full" /> {/* History list placeholder */}
             <Skeleton className="h-px w-full" />
            <Skeleton className="h-6 w-1/3 mb-2" /> {/* File versions heading */}
            <Skeleton className="h-20 w-full" /> {/* File versions placeholder */}
             <Skeleton className="h-px w-full" />
            <Skeleton className="h-6 w-1/3 mb-2" /> {/* Comments form heading */}
            <Skeleton className="h-32 w-full" /> {/* Comments form placeholder */}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ticketData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Ticket Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The ticket with ID <span className="font-mono">{ticketId}</span> could not be found.
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
  const filesForVersionHistory = ticket.attachmentNames || []; // Could also include files from commits

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
                  {ticket.attachmentNames.map((name, index) => (
                    <li key={index} className="flex items-center gap-2">
                        <HardDriveUpload className="h-4 w-4 text-muted-foreground" /> 
                        {name}
                    </li>))}
                </ul>
                <div className="mt-4 p-4 border rounded-md bg-muted/50">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                        <FileClock className="h-4 w-4" /> Version Comparison (Placeholder)
                    </h4>
                    <p className="text-xs text-muted-foreground">
                        File version comparison and diff view for .py, .xml, and .rptdesign files will be displayed here.
                        This feature is under development.
                    </p>
                </div>
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
           
            <Separator className="my-6"/>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
                <MessageSquare className="h-5 w-5"/> Comentarios
            </h3>
            {ticketId && <CommentForm ticketId={ticketId} />}
           
          </CardContent>
           <CardFooter className="text-xs text-muted-foreground">
             Ticket ID: {ticket.id}
           </CardFooter>
        </Card>
      </div>

      {user?.role === 'admin' && ticketId && ticketData?.ticket &&(
        <>
            <Separator className="my-8" />
            <VersionHistoryCard ticketId={ticketId} files={filesForVersionHistory} />
            <Separator className="my-8" />
            <CommitChangesForm ticketId={ticketId} currentTicketStatus={ticketData.ticket.status} />
        </>
      )}
    </div>
  );
}
