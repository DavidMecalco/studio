
"use client";

import type { DeploymentLogEntry } from '@/services/deployment';
import type { User as ServiceUser } from '@/services/users';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { Server, User, CalendarDays, FileText, Link as LinkIcon, AlertCircle, CheckCircle2, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';

interface DeploymentListProps {
  deploymentLogs: DeploymentLogEntry[];
  users: ServiceUser[]; // To map userId to user name
  maxItems?: number;
}

export function DeploymentList({ deploymentLogs, users, maxItems }: DeploymentListProps) {
  const displayedLogs = maxItems ? deploymentLogs.slice(0, maxItems) : deploymentLogs;

  if (!displayedLogs.length) {
    return <p className="text-muted-foreground">No deployment logs found.</p>;
  }

  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || userId;

  const getStatusIcon = (status: DeploymentLogEntry['status']) => {
    switch (status) {
      case 'Success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'Failure': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'In Progress': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'Pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Server className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Timestamp</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Environment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Files Deployed</TableHead>
            <TableHead>Tickets</TableHead>
            <TableHead>Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium text-xs">
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3 text-muted-foreground" />
                  {format(parseISO(log.timestamp), "MMM d, yyyy HH:mm")}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <User className="h-3 w-3 text-muted-foreground" />
                  {getUserName(log.userId)}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{log.environment}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={log.status === 'Success' ? 'default' : log.status === 'Failure' ? 'destructive' : 'secondary'}
                  className={`capitalize ${
                    log.status === 'Success' ? 'bg-green-100 text-green-800 border-green-300' :
                    log.status === 'Failure' ? 'bg-red-100 text-red-800 border-red-300' :
                    log.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                    log.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                    ''
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {getStatusIcon(log.status)}
                    {log.status}
                  </span>
                </Badge>
              </TableCell>
              <TableCell className="text-xs">
                {log.filesDeployed.map((file, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span title={file.name} className="truncate max-w-[150px]">{file.name}</span>
                    {file.version && <span className="text-muted-foreground">(v{file.version})</span>}
                  </div>
                ))}
                 {log.filesDeployed.length === 0 && "-"}
              </TableCell>
              <TableCell className="text-xs">
                {log.ticketIds && log.ticketIds.length > 0 ? (
                  log.ticketIds.map(ticketId => (
                    <Button key={ticketId} variant="link" size="sm" asChild className="p-0 h-auto text-xs">
                      <Link href={`/jira/${ticketId}`} className="flex items-center gap-0.5">
                        <LinkIcon className="h-3 w-3"/>{ticketId}
                      </Link>
                    </Button>
                  ))
                ) : '-'}
              </TableCell>
              <TableCell className="text-xs max-w-[200px] truncate" title={log.message}>
                {log.message || '-'}
                {log.resultCode && <span className="text-muted-foreground"> (Code: {log.resultCode})</span>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
