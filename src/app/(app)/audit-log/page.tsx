
"use client";

import { useEffect, useState, useMemo } from 'react';
import { getAllTicketHistories, type JiraTicketHistoryEntry } from '@/services/jira';
import { getDeploymentLogs, type DeploymentLogEntry } from '@/services/deployment';
import { getUsers, type User as ServiceUser } from '@/services/users';
import { AuditLogList } from '@/components/audit/audit-log-list';
import { AuditLogFilters, type AuditFilters } from '@/components/audit/audit-log-filters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { History, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, isWithinInterval, subDays } from 'date-fns';

// Define a unified type for combined audit entries
export type CombinedAuditEntry = JiraTicketHistoryEntry & {
  entryType: 'ticket' | 'deployment';
  // Add specific fields if needed, e.g., environment for deployment entries
  environment?: string; 
  filesDeployedCount?: number;
  deploymentStatus?: string;
};


export default function AuditLogPage() {
  const { user, loading: authLoading } = useAuth();
  const [allHistory, setAllHistory] = useState<JiraTicketHistoryEntry[]>([]);
  const [allDeployments, setAllDeployments] = useState<DeploymentLogEntry[]>([]);
  const [users, setUsers] = useState<ServiceUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState<AuditFilters>({
    dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    dateTo: format(new Date(), 'yyyy-MM-dd'),
    selectedUserId: 'all',
    selectedActionType: 'all',
    searchTerm: '',
  });

  useEffect(() => {
    async function fetchData() {
       if (authLoading || !user || user.role !== 'admin') {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [ticketHistories, deploymentLogs, serviceUsers] = await Promise.all([
          getAllTicketHistories(),
          getDeploymentLogs(),
          getUsers(),
        ]);
        setAllHistory(ticketHistories);
        setAllDeployments(deploymentLogs);
        setUsers(serviceUsers);
      } catch (error) {
        console.error("Error fetching audit data:", error);
      }
      setIsLoading(false);
    }
    fetchData();
  }, [user, authLoading]);

  const combinedAndFilteredAuditLog = useMemo(() => {
    if (isLoading) return [];

    const transformedDeployments: CombinedAuditEntry[] = allDeployments.map(dep => ({
      id: dep.id,
      timestamp: dep.timestamp,
      userId: dep.userId,
      action: `Deployment: ${dep.status}`,
      details: `Deployed ${dep.filesDeployed.length} file(s) to ${dep.environment}. ${dep.message || ''}`,
      deploymentId: dep.id,
      ticketId: dep.ticketIds && dep.ticketIds.length > 0 ? dep.ticketIds.join(', ') : undefined,
      entryType: 'deployment',
      environment: dep.environment,
      filesDeployedCount: dep.filesDeployed.length,
      deploymentStatus: dep.status,
    }));

    const transformedTicketHistory: CombinedAuditEntry[] = allHistory.map(hist => ({
      ...hist,
      entryType: 'ticket',
    }));
    
    let combinedLog = [...transformedTicketHistory, ...transformedDeployments];

    // Apply filters
    const dateFrom = filters.dateFrom ? parseISO(filters.dateFrom) : null;
    const dateTo = filters.dateTo ? parseISO(filters.dateTo) : null;
    const dateInterval = dateFrom && dateTo ? { start: dateFrom, end: dateTo } : null;

    combinedLog = combinedLog.filter(entry => {
      const entryDate = parseISO(entry.timestamp);
      if (dateInterval && !isWithinInterval(entryDate, dateInterval)) return false;
      if (filters.selectedUserId !== 'all' && entry.userId !== filters.selectedUserId) return false;
      
      if (filters.selectedActionType !== 'all') {
        if (filters.selectedActionType === 'deployment' && entry.entryType !== 'deployment') return false;
        if (filters.selectedActionType === 'ticket_status_change' && (entry.entryType !== 'ticket' || !entry.action.toLowerCase().includes('status changed'))) return false;
        if (filters.selectedActionType === 'ticket_commit' && (entry.entryType !== 'ticket' || !entry.action.toLowerCase().includes('commit added'))) return false;
        if (filters.selectedActionType === 'ticket_created' && (entry.entryType !== 'ticket' || !entry.action.toLowerCase().includes('created'))) return false;
        if (filters.selectedActionType === 'file_restored' && (entry.entryType !== 'ticket' || !entry.action.toLowerCase().includes('file restored'))) return false;
      }

      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const searchableContent = [
          entry.userId,
          entry.action,
          entry.details,
          entry.ticketId,
          entry.commitSha,
          entry.deploymentId,
          entry.comment,
          (entry as CombinedAuditEntry).environment,
          (entry as CombinedAuditEntry).deploymentStatus,
        ].join(' ').toLowerCase();
        if (!searchableContent.includes(term)) return false;
      }
      return true;
    });

    return combinedLog.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [isLoading, allHistory, allDeployments, filters]);


  if (authLoading || (isLoading && combinedAndFilteredAuditLog.length === 0)) {
    return (
        <div className="space-y-8">
             <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-7 w-48" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Card>
                <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                <CardContent><Skeleton className="h-20 w-full" /></CardContent>
            </Card>
            <Card>
                <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                <CardContent className="space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </CardContent>
            </Card>
        </div>
    );
  }
  
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">This page is for admin users only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <History className="h-8 w-8 text-primary" /> Audit Log Central
          </h1>
          <p className="text-muted-foreground">
            Track all system activities, changes, and deployments.
          </p>
        </div>
      </div>

      <AuditLogFilters 
        filters={filters}
        onFiltersChange={setFilters}
        users={users}
        isLoading={isLoading}
      />

      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Detailed record of all auditable events in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogList auditEntries={combinedAndFilteredAuditLog} />
        </CardContent>
      </Card>
    </div>
  );
}
