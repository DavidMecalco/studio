
"use client"; 

import { useEffect, useState, type ChangeEvent }  from 'react';
import { useParams } from 'next/navigation'; 
import { getJiraTicket, type JiraTicket } from '@/services/jira';
import { getGitHubCommits, type GitHubCommit } from '@/services/github';
import { getUsers, type UserDoc as ServiceUser } from '@/services/users'; // Added for admin actions
import { CommitList } from '@/components/github/commit-list';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Ticket as TicketIcon, Github as GithubIcon, User as UserIconLucide, GitBranch, AlertTriangle, HardDriveUpload, FileClock, History, FileDiff, MessageSquare, Paperclip, UploadCloud, Loader2, XIcon, FileText } from 'lucide-react'; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { CommitChangesForm } from '@/components/tickets/commit-changes-form';
import { Skeleton } from '@/components/ui/skeleton';
import { TicketHistoryList } from '@/components/tickets/ticket-history-list';
import { FileVersionHistoryDialog } from '@/components/files/file-version-history-dialog';
import { CommentForm } from '@/components/tickets/CommentForm';
import { useToast } from '@/hooks/use-toast';
// import { addAttachmentsToTicketAction } from '@/app/actions/jira-actions'; // Commented out as AddAttachmentsForm is removed
// import { Input } from '@/components/ui/input'; // Commented out as AddAttachmentsForm is removed
// import { Label } from '@/components/ui/label'; // Commented out as AddAttachmentsForm is removed
import { TicketAdminActions } from '@/components/tickets/ticket-admin-actions'; // Added


interface TicketDetailsData {
  ticket: JiraTicket;
  commits: GitHubCommit[];
  users: ServiceUser[]; // Added for admin actions
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

// Form for adding new attachments - REMOVED
// const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
// const ALLOWED_ATTACHMENT_MIME_TYPES = [
//   'image/jpeg', 'image/png', 'image/gif', 
//   'application/pdf', 
//   'application/msword', 
//   'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
//   'text/plain', 'text/xml', 'application/xml',
//   'application/vnd.ms-excel', 
//   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//   'application/zip', 'application/x-zip-compressed',
//   // For code files
//   'text/x-python', 'application/python',
//   'text/javascript', 'application/javascript',
//   'application/json',
// ];

// function AddAttachmentsForm({ ticketId, onAttachmentsAdded }: { ticketId: string, onAttachmentsAdded: () => void }) {
//     const { user } = useAuth();
//     const { toast } = useToast();
//     const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
//     const [isSubmitting, setIsSubmitting] = useState(false);

//     const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
//         if (event.target.files) {
//             const filesArray = Array.from(event.target.files);
//             const validFiles = filesArray.filter(file => {
//                 if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
//                     toast({
//                         title: "Archivo Demasiado Grande",
//                         description: `El archivo "${file.name}" excede el límite de 5MB.`,
//                         variant: "destructive",
//                     });
//                     return false;
//                 }
//                 // Basic MIME type check; for more robustness, consider server-side validation or more specific client-side checks
//                 if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.type) && !file.name.endsWith('.py') && !file.name.endsWith('.xml') && !file.name.endsWith('.rptdesign') && !file.name.endsWith('.sql')) {
//                     toast({
//                         title: "Tipo de Archivo No Permitido",
//                         description: `El tipo de archivo de "${file.name}" (${file.type}) no está permitido.`,
//                         variant: "destructive",
//                     });
//                     return false;
//                 }
//                 return true;
//             }).slice(0, 5 - selectedFiles.length); // Limit to 5 files total

//             setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5));
//             if (filesArray.length + selectedFiles.length > 5) {
//                 toast({
//                     title: "Límite de Archivos Alcanzado",
//                     description: `Solo se pueden subir hasta 5 archivos. Se ignoraron los adicionales.`,
//                     variant: "warning",
//                 })
//             }
//             event.target.value = ""; // Reset file input
//         }
//     };

//     const removeFile = (fileName: string) => {
//         setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
//     };

//     const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
//         event.preventDefault();
//         if (!user) {
//             toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
//             return;
//         }
//         if (selectedFiles.length === 0) {
//             toast({ title: "Sin Archivos", description: "Por favor, seleccione al menos un archivo para adjuntar.", variant: "destructive" });
//             return;
//         }

//         setIsSubmitting(true);
//         const attachmentNames = selectedFiles.map(file => file.name);
//         const result = await addAttachmentsToTicketAction(ticketId, user.id, attachmentNames);

//         if (result.success) {
//             toast({
//                 title: "Adjuntos Agregados",
//                 description: "Los archivos han sido adjuntados al ticket. (Simulado)",
//             });
//             setSelectedFiles([]);
//             onAttachmentsAdded(); // Callback to refresh ticket data
//         } else {
//             toast({
//                 title: "Error al Adjuntar",
//                 description: result.error || "No se pudieron adjuntar los archivos.",
//                 variant: "destructive",
//             });
//         }
//         setIsSubmitting(false);
//     };
    
//     return (
//         <Card className="shadow-md rounded-lg mt-6">
//             <CardHeader>
//                 <CardTitle className="flex items-center gap-2 text-lg">
//                     <Paperclip className="h-5 w-5 text-primary" /> Adjuntar Nuevos Archivos
//                 </CardTitle>
//                 <CardDescription>
//                     Suba archivos relevantes para este ticket (máx. 5 archivos, 5MB c/u).
//                 </CardDescription>
//             </CardHeader>
//             <CardContent>
//                 <form onSubmit={handleSubmit} className="space-y-4">
//                     <div>
//                         <Label htmlFor={`attachments-${ticketId}`}>Seleccionar archivos</Label>
//                         <div className="mt-1 flex items-center gap-2">
//                             <Input
//                                 id={`attachments-${ticketId}`}
//                                 type="file"
//                                 multiple
//                                 onChange={handleFileChange}
//                                 className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
//                                 accept={ALLOWED_ATTACHMENT_MIME_TYPES.join(',')}
//                                 disabled={selectedFiles.length >= 5 || isSubmitting}
//                             />
//                             <UploadCloud className="h-6 w-6 text-muted-foreground" />
//                         </div>
//                         {selectedFiles.length > 0 && (
//                             <div className="mt-3 space-y-2">
//                                 <p className="text-sm font-medium">Archivos seleccionados:</p>
//                                 <ul className="list-none space-y-1">
//                                     {selectedFiles.map(file => (
//                                         <li key={file.name} className="flex justify-between items-center text-sm p-2 border rounded-md bg-muted/50">
//                                             <div className="flex items-center gap-2">
//                                                 <FileText className="h-4 w-4 text-muted-foreground" />
//                                                 <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
//                                             </div>
//                                             <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(file.name)} className="text-destructive hover:bg-destructive/10 h-6 w-6" disabled={isSubmitting}>
//                                                 <XIcon className="h-4 w-4" />
//                                             </Button>
//                                         </li>
//                                     ))}
//                                 </ul>
//                             </div>
//                         )}
//                         {selectedFiles.length >= 5 && (
//                             <p className="text-xs text-destructive mt-1">Ha alcanzado el límite de 5 archivos.</p>
//                         )}
//                     </div>
//                     <Button type="submit" disabled={isSubmitting || selectedFiles.length === 0}>
//                         {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Paperclip className="mr-2 h-4 w-4" />}
//                         {isSubmitting ? "Adjuntando..." : "Adjuntar Archivos"}
//                     </Button>
//                 </form>
//             </CardContent>
//         </Card>
//     );
// }


async function fetchTicketDetails(ticketId: string): Promise<TicketDetailsData | null> {
  try {
    const ticket = await getJiraTicket(ticketId);
    if (!ticket) {
      return null;
    }
    // Fetch commits and users in parallel
    const [commits, users] = await Promise.all([
        getGitHubCommits(ticket.id),
        getUsers() // For admin actions dropdown
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
  const ticketId = params.ticketId; 

  const [ticketData, setTicketData] = useState<TicketDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTicketData = () => {
    if (ticketId) {
        // Do not set isLoading to true here to avoid full page skeleton on refresh from actions on page
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
              {[...Array(3)].map((_, i) => <div key={`skel-info-${i}`}><Skeleton className="h-4 w-1/3 mb-1" /><Skeleton className="h-5 w-2/3" /></div>)}
            </div>
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-6 w-1/4 mb-2" /> {/* Description heading */}
            <Skeleton className="h-16 w-full" /> {/* Description content */}
            
            <Skeleton className="h-px w-full my-3" /> {/* Admin actions placeholder */}
            <Skeleton className="h-6 w-1/3 mb-2" /> 
            <Skeleton className="h-40 w-full" /> 
            
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
             {/* <Skeleton className="h-px w-full" /> // Removed skeleton for AddAttachmentsForm */}
            {/* <Skeleton className="h-6 w-1/3 mb-2" /> // Removed skeleton for AddAttachmentsForm */}
            {/* <Skeleton className="h-40 w-full" /> // Removed skeleton for AddAttachmentsForm */}
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
  const filesForVersionHistory = ticket.attachmentNames || [];

  const canManageTicketCommits = user?.role === 'admin'; 
  const canManageTicketAdminActions = user?.role === 'admin' || user?.role === 'superuser';
  const canViewVersionHistory = user?.role === 'admin' || user?.role === 'superuser';
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

            {ticket.attachmentNames && ticket.attachmentNames.length > 0 && (
              <>
                <Separator className="my-6" />
                <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                    <Paperclip className="h-5 w-5" /> Attachments
                </h3>
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
           
            {/* {canInteractWithTicket && ticketId && (  // AddAttachmentsForm removed
                <>
                    <Separator className="my-6"/>
                    <AddAttachmentsForm ticketId={ticketId} onAttachmentsAdded={refreshTicketData} />
                </>
            )} */}

            {canInteractWithTicket && ( 
                <>
                    <Separator className="my-6"/>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
                        <MessageSquare className="h-5 w-5"/> Comentarios
                    </h3>
                    {ticketId && <CommentForm ticketId={ticketId} />} 
                </>
            )}
           
          </CardContent>
           <CardFooter className="text-xs text-muted-foreground">
             Ticket ID: {ticket.id}
           </CardFooter>
        </Card>
      </div>

      {canViewVersionHistory && ticketId && filesForVersionHistory.length > 0 && (
         <>
            <Separator className="my-8" />
            <VersionHistoryCard ticketId={ticketId} files={filesForVersionHistory} />
         </>
      )}
      
      {canManageTicketCommits && ticketId && ticketData?.ticket && (
        <>
            <Separator className="my-8" />
            <CommitChangesForm ticketId={ticketId} currentTicketStatus={ticketData.ticket.status} />
        </>
      )}
    </div>
  );
}

