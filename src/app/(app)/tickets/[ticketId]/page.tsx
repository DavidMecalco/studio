
"use client"; 

import { useEffect, useState, type ChangeEvent }  from 'react';
import { useParams } from 'next/navigation'; 
import { getTicketById, type Ticket as LocalTicket } from '@/services/tickets'; 
import { getGitHubCommits, type GitHubCommit } from '@/services/github';
import { getUsers, type UserDoc as ServiceUser } from '@/services/users'; 
import { CommitList } from '@/components/github/commit-list';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Ticket as TicketIcon, Github as GithubIcon, User as UserIconLucide, GitBranch, AlertTriangle, History, MessageSquare, Tag, Server, Users, ShieldCheck, CalendarDays, Edit } from 'lucide-react';
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
  ticket: LocalTicket;
  commits: GitHubCommit[];
  users: ServiceUser[]; 
}


async function fetchTicketDetails(ticketId: string): Promise<TicketDetailsData | null> {
  try {
    const ticket = await getTicketById(ticketId); 
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
        setIsLoading(true); 
        fetchTicketDetails(ticketId)
            .then(data => setTicketData(data))
            .catch(error => console.error("Failed to refresh ticket data:", error))
            .finally(() => setIsLoading(false)); 
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
    return <TicketDetailLoadingSkeleton />;
  }

  if (!ticketData || !ticketData.ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Ticket No Encontrado</h1>
        <p className="text-muted-foreground mb-6">
          El ticket con ID <span className="font-mono">{ticketId}</span> no pudo ser encontrado.
        </p>
        <Button asChild>
          <Link href={user?.role === 'client' ? "/my-tickets" : "/tickets"}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Tickets
          </Link>
        </Button>
      </div>
    );
  }

  const { ticket, commits, users: allUsers } = ticketData;

  const canManageTicketCommits = user?.role === 'admin' || user?.role === 'superuser';
  const canManageTicketAdminActions = user?.role === 'admin' || user?.role === 'superuser';
  const canInteractWithTicket = !!user; 

  const requestingUser = allUsers.find(u => u.id === ticket.requestingUserId);
  const assignedUser = ticket.assigneeId ? allUsers.find(u => u.id === ticket.assigneeId) : null;

  const getStatusBadgeClass = (status: LocalTicket['status']) => {
    switch (status) {
      case 'Abierto': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'En Progreso': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Pendiente': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Reabierto': return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'En espera del visto bueno': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Resuelto':
      case 'Cerrado': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityBadgeClass = (priority: LocalTicket['priority']) => {
    switch (priority) {
      case 'Alta': return 'bg-red-100 text-red-800 border-red-300';
      case 'Media': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Baja': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="outline" size="sm" className="mb-6">
          <Link href={user?.role === 'client' ? "/my-tickets" : "/tickets"} className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Volver a Tickets
          </Link>
        </Button>
        <Card className="shadow-xl rounded-xl border-border">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
              <div className="flex-1">
                <CardTitle className="text-2xl lg:text-3xl font-bold flex items-start gap-3">
                  <TicketIcon className="h-7 w-7 lg:h-8 lg:w-8 text-primary mt-1 flex-shrink-0" /> 
                  <span>{ticket.title}</span>
                </CardTitle>
                <CardDescription className="mt-1.5 ml-10 lg:ml-11">
                  ID del Ticket: <span className="font-mono text-xs">{ticket.id}</span>
                </CardDescription>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                <Badge variant="outline" className={`text-sm px-3 py-1 ${getStatusBadgeClass(ticket.status)}`}>
                  {ticket.status}
                </Badge>
                 <Badge variant="outline" className={`text-xs px-2.5 py-1 ${getPriorityBadgeClass(ticket.priority)}`}>
                    Prioridad: {ticket.priority}
                </Badge>
                <Badge variant="outline" className="text-xs px-2.5 py-1 flex items-center gap-1 bg-muted/50">
                    <Tag className="h-3.5 w-3.5"/> Tipo: {ticket.type}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-6">
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 py-2">
                <InfoItem icon={<UserIconLucide />} label="Usuario Solicitante" value={requestingUser?.name || ticket.requestingUserId} />
                <InfoItem icon={<ShieldCheck />} label="Organización (Cliente)" value={ticket.provider || 'N/A'} />
                <InfoItem icon={<GitBranch />} label="Repositorio GitHub" value={ticket.githubRepository} isLink={`https://github.com/${ticket.githubRepository}`} />
                <InfoItem icon={<Server />} label="Ambiente/Branch" value={ticket.branch || 'N/A'} />
                <InfoItem icon={<CalendarDays />} label="Última Actualización" value={ticket.lastUpdated ? format(parseISO(ticket.lastUpdated), "PPP p") : 'N/A'} />
                 {assignedUser && <InfoItem icon={<Users />} label="Asignado A" value={assignedUser.name} />}
            </div>
            
            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-foreground"><Edit className="h-5 w-5" /> Descripción</h3>
              <p className="text-muted-foreground whitespace-pre-wrap p-3 bg-muted/30 rounded-md border">
                {ticket.description}
              </p>
            </div>
            
            {canManageTicketAdminActions && allUsers.length > 0 && (
                <>
                    <Separator/>
                     <div className="pt-2">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
                            <Edit className="h-5 w-5 text-primary" /> Manage Ticket
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Update status, priority, type, or assignee.
                        </p>
                        <TicketAdminActions ticket={ticket} users={allUsers} onTicketUpdate={refreshTicketData} />
                    </div>
                </>
            )}

            <Separator/>

            <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
                    <GithubIcon className="h-5 w-5"/> Commits Asociados en GitHub
                </h3>
                {commits.length > 0 ? (
                     <CommitList commits={commits} title=""/>
                ) : (
                     <p className="text-muted-foreground italic p-3 bg-muted/30 rounded-md border">No se encontraron commits de GitHub para este ticket.</p>
                )}
            </div>

            <Separator/>
            <div>
                 <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
                    <History className="h-5 w-5"/> Historial del Ticket
                </h3>
                <TicketHistoryList history={ticket.history} title="" />
            </div>
           
            {canInteractWithTicket && ticketId && ( 
                <>
                    <Separator/>
                     <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
                        <MessageSquare className="h-5 w-5"/> Comentarios
                    </h3>
                    <CommentForm ticketId={ticketId} /> 
                </>
            )}
           
          </CardContent>
           <CardFooter className="text-xs text-muted-foreground pt-4 border-t">
             ID del Ticket: {ticket.id}
           </CardFooter>
        </Card>
      </div>
      
      {canManageTicketCommits && ticketId && ticketData?.ticket && (
        <>
            <Separator className="my-8" />
            <CommitChangesForm 
                ticketId={ticketId} 
                currentTicketStatus={ticketData.ticket.status}
                allCommits={commits}
            />
        </>
      )}
    </div>
  );
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  isLink?: string;
}

function InfoItem({ icon, label, value, isLink }: InfoItemProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex-shrink-0 text-primary mt-1">{icon}</div>
      <div>
        <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
        {isLink && value ? (
          <Link href={isLink} target="_blank" rel="noopener noreferrer" className="text-sm text-foreground hover:underline">
            {value}
          </Link>
        ) : (
          <p className="text-sm text-foreground font-medium">{value || '-'}</p>
        )}
      </div>
    </div>
  );
}

function TicketDetailLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-32 mb-6" /> {/* Back button */}
      
      <Card className="shadow-xl rounded-xl border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
            <div className="flex-1">
              <Skeleton className="h-8 w-3/4 mb-2" /> {/* Title */}
              <Skeleton className="h-4 w-1/2" /> {/* ID */}
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
              <Skeleton className="h-7 w-28" /> {/* Status Badge */}
              <Skeleton className="h-5 w-24" /> {/* Priority Badge */}
              <Skeleton className="h-5 w-32" /> {/* Type Badge */}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          <Skeleton className="h-px w-full" /> {/* Separator */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 py-2">
            {[...Array(5)].map((_, i) => (
              <div key={`info-skel-${i}`} className="flex items-start gap-2">
                <Skeleton className="h-5 w-5 rounded-full mt-1" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1.5" /> {/* Label */}
                  <Skeleton className="h-5 w-36" /> {/* Value */}
                </div>
              </div>
            ))}
          </div>
          
          <Skeleton className="h-px w-full" />
          <div>
            <Skeleton className="h-6 w-1/4 mb-2" /> {/* Description Title */}
            <Skeleton className="h-20 w-full rounded-md" /> {/* Description Content */}
          </div>
          
          <Skeleton className="h-px w-full" /> {/* Admin Actions Skeleton (if applicable) */}
          <div className="pt-2 space-y-3">
            <Skeleton className="h-6 w-1/3 mb-1" /> {/* Admin Actions Title */}
            <Skeleton className="h-4 w-3/4 mb-3" /> {/* Admin Actions Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={`admin-action-item-${i}`} className="h-10 w-full" />)}
            </div>
            <Skeleton className="h-10 w-1/4" /> {/* Update button */}
          </div>


          <Skeleton className="h-px w-full" />
          <div>
            <Skeleton className="h-6 w-1/3 mb-3" /> {/* Associated Commits Title */}
            <Skeleton className="h-40 w-full rounded-md" /> {/* Commits List Skeleton */}
          </div>
          
          <Skeleton className="h-px w-full" />
          <div>
            <Skeleton className="h-6 w-1/3 mb-3" /> {/* History Title */}
            <Skeleton className="h-32 w-full rounded-md" /> {/* History List Skeleton */}
          </div>
          
          <Skeleton className="h-px w-full" />
          <div>
            <Skeleton className="h-6 w-1/3 mb-3" /> {/* Comments Title */}
            <Skeleton className="h-28 w-full rounded-md" /> {/* Comment Form Skeleton */}
          </div>
        </CardContent>
         <CardFooter className="pt-4 border-t">
            <Skeleton className="h-3 w-24" />
         </CardFooter>
      </Card>

      <Card className="shadow-md rounded-lg">
        <CardHeader>
            <Skeleton className="h-6 w-1/2 mb-1" />
            <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" /> {/* Commit message textarea */}
            <Skeleton className="h-10 w-full" /> {/* Branch select */}
            <Skeleton className="h-10 w-1/3" /> {/* Submit button */}
            <Skeleton className="h-px w-full my-3" />
            <Skeleton className="h-6 w-1/2 mb-1" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" /> {/* Restore commit select */}
            <Skeleton className="h-10 w-2/5" /> {/* Restore button */}
        </CardContent>
      </Card>
    </div>
  );
}

