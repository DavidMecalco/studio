
"use client";

import type { TicketHistoryEntry as LocalTicketHistoryEntry } from '@/services/tickets'; // Updated import
import { format, parseISO } from 'date-fns';
import { User, Edit3, GitCommit, ArrowRight, MessageSquare, Layers, RefreshCcw, FileText, AlertCircle, Tag } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface TicketHistoryItemProps {
  entry: LocalTicketHistoryEntry & { ticketId?: string }; // Updated type
  isLastItem: boolean;
}

const getIconForAction = (action: string) => {
  if (action.toLowerCase().includes('created')) return <Layers className="h-4 w-4 text-primary" />;
  if (action.toLowerCase().includes('status changed')) return <Edit3 className="h-4 w-4 text-yellow-500" />;
  if (action.toLowerCase().includes('assignee changed')) return <User className="h-4 w-4 text-blue-400" />;
  if (action.toLowerCase().includes('priority changed')) return <AlertCircle className="h-4 w-4 text-orange-500" />;
  if (action.toLowerCase().includes('type changed')) return <Tag className="h-4 w-4 text-purple-500" />;
  if (action.toLowerCase().includes('commit added')) return <GitCommit className="h-4 w-4 text-blue-500" />;
  if (action.toLowerCase().includes('comment added')) return <MessageSquare className="h-4 w-4 text-green-500" />;
  if (action.toLowerCase().includes('deployment')) return <Layers className="h-4 w-4 text-purple-500" />; 
  if (action.toLowerCase().includes('file restored')) return <RefreshCcw className="h-4 w-4 text-indigo-500" />;
  if (action.toLowerCase().includes('attachments added')) return <FileText className="h-4 w-4 text-teal-500" />;
  return <Edit3 className="h-4 w-4 text-muted-foreground" />;
};


export function TicketHistoryItem({ entry, isLastItem }: TicketHistoryItemProps) {
  const isComment = entry.action.toLowerCase().includes('comment added');

  return (
    <li className="relative pl-8">
      {!isLastItem && (
        <div className="absolute left-[10px] top-5 -bottom-3 w-0.5 bg-border"></div>
      )}
      <div className="absolute left-[3px] top-[14px] flex h-4 w-4 items-center justify-center rounded-full bg-background ring-4 ring-border">
        {getIconForAction(entry.action)}
      </div>
      <div className="flex flex-col space-y-1 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">{entry.userId}</span>
             {(entry as any).ticketId && entry.action !== 'Created' && !isComment && ( 
              <Badge variant="outline" className="text-xs">
                Ticket: <Link href={`/tickets/${(entry as any).ticketId}`} className="hover:underline ml-1">{(entry as any).ticketId}</Link> {/* Updated path */}
              </Badge>
            )}
          </div>
          <time className="text-xs text-muted-foreground">
            {format(parseISO(entry.timestamp), "MMM d, yyyy 'at' h:mm a")}
          </time>
        </div>
        
        {!isComment && <p className="text-sm font-semibold text-foreground">{entry.action}</p>}
        {entry.details && !isComment && <p className="text-sm text-muted-foreground">{entry.details}</p>}

        {entry.fromStatus && entry.toStatus && (
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            Status: <Badge variant="secondary">{entry.fromStatus}</Badge>
            <ArrowRight className="h-3 w-3" />
            <Badge>{entry.toStatus}</Badge>
          </div>
        )}

        {entry.fromPriority && entry.toPriority && (
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            Prioridad: <Badge variant="secondary">{entry.fromPriority}</Badge>
            <ArrowRight className="h-3 w-3" />
            <Badge 
                variant={entry.toPriority === 'Alta' ? 'destructive' : entry.toPriority === 'Media' ? 'secondary' : 'outline'}
                className={
                    entry.toPriority === 'Alta' ? 'bg-red-100 text-red-800 border-red-300' :
                    entry.toPriority === 'Media' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                    'bg-gray-100 text-gray-800 border-gray-300'
                }
            >{entry.toPriority}</Badge>
          </div>
        )}

        {entry.fromType && entry.toType && (
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            Tipo: <Badge variant="secondary">{entry.fromType}</Badge>
            <ArrowRight className="h-3 w-3" />
            <Badge variant="outline">{entry.toType}</Badge>
          </div>
        )}
        
        {entry.comment && (
          <div className={`text-sm pl-2 ${isComment ? 'bg-muted/50 p-3 rounded-md border' : 'italic text-muted-foreground border-l-2 border-border'}`}>
            {isComment && <p className="text-xs font-medium text-foreground mb-1">Comentario:</p>}
            <p className={isComment ? 'text-foreground whitespace-pre-wrap' : 'text-muted-foreground whitespace-pre-wrap'}>
              {entry.comment}
            </p>
          </div>
        )}

        {entry.commitSha && !entry.action.toLowerCase().includes('file restored') && ( 
          <p className="text-sm text-muted-foreground">
            Commit: <span className="font-mono text-xs">{entry.commitSha.substring(0, 7)}</span>
          </p>
        )}
         {entry.deploymentId && (
          <p className="text-sm text-muted-foreground">
            Deployment ID: <span className="font-mono text-xs">{entry.deploymentId}</span>
          </p>
        )}
        {entry.action.toLowerCase().includes('file restored') && entry.fileName && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>{entry.fileName} restored to version {entry.restoredVersionId}</span>
            {entry.commitSha && <span className="font-mono text-xs">(commit: {entry.commitSha.substring(0,7)})</span>}
          </p>
        )}
        {entry.action.toLowerCase().includes('attachments added') && entry.attachedFileNames && (
            <p className="text-sm text-muted-foreground">
                Archivos adjuntos: {entry.attachedFileNames.join(', ')}
            </p>
        )}
      </div>
    </li>
  );
}

