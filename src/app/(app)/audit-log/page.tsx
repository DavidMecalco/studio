
"use client";

import { useEffect, useState, useMemo } from 'react';
import { getAllTicketHistories, type TicketHistoryEntry as LocalTicketHistoryEntry } from '@/services/tickets'; // Updated import
import { getDeploymentLogs, type DeploymentLogEntry } from '@/services/deployment';
import { getUsers, type UserDoc as ServiceUser } from '@/services/users';
import { AuditLogList } from '@/components/audit/audit-log-list';
import { AuditLogFilters, type AuditFilters } from '@/components/audit/audit-log-filters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { History, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, isWithinInterval, subDays } from 'date-fns';

export type CombinedAuditEntry = LocalTicketHistoryEntry & { // Updated type
  entryType: 'ticket' | 'deployment';
  environment?: string; 
  filesDeployedCount?: number;
  deploymentStatus?: string;
};


export default function AuditLogPage() {
  const { user, loading: authLoading } = useAuth();
  const [allHistory, setAllHistory] = useState<LocalTicketHistoryEntry[]>([]); // Updated type
  const [allDeployments, setAllDeployments] = useState<DeploymentLogEntry[]>([]);
  const [serviceUsers, setServiceUsers] = useState<ServiceUser[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [filters, setFilters] = useState<AuditFilters>({
    dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    dateTo: format(new Date(), 'yyyy-MM-dd'),
    selectedUserId: 'all',
    selectedActionType: 'all',
    searchTerm: '',
  });

  const canViewPage = user?.role === 'admin' || user?.role === 'superuser';

  useEffect(() => {
    async function fetchData() {
       if (authLoading || !canViewPage || !user) {
        setIsPageLoading(false);
        return;
      }
      setIsPageLoading(true);
      try {
        const [ticketHistories, deploymentLogs, fetchedServiceUsers] = await Promise.all([
          getAllTicketHistories(), // Uses local ticket service
          getDeploymentLogs(),
          getUsers(),
        ]);
        setAllHistory(ticketHistories);
        setAllDeployments(deploymentLogs);
        setServiceUsers(fetchedServiceUsers);
      } catch (error) {
        console.error("Error fetching audit data:", error);
      }
      setIsPageLoading(false);
    }
    if (canViewPage && !authLoading && user) {
        fetchData();
    } else if (!authLoading) {
        setIsPageLoading(false);
    }
  }, [user, authLoading, canViewPage]);

  const combinedAndFilteredAuditLog = useMemo(() => {
    if (isPageLoading || !canViewPage) return [];

    const transformedDeployments: CombinedAuditEntry[] = allDeployments.map(dep => ({
      id: dep.id,
      timestamp: dep.timestamp,
      userId: dep.userId,
      action: `Deployment: ${dep.status}`,
      details: `Deployed ${dep.filesDeployed.length} file(s) to ${dep.environment}. ${dep.message || ''}`,
      // deploymentId: dep.id, // This field is not in LocalTicketHistoryEntry, so we can remove or map if needed
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
          (entry as any).ticketId, // Cast to any if ticketId might not be on LocalTicketHistoryEntry directly
          entry.commitSha,
          (entry as any).deploymentId, // Cast to any if deploymentId might not be on LocalTicketHistoryEntry
          entry.comment,
          (entry as CombinedAuditEntry).environment,
          (entry as CombinedAuditEntry).deploymentStatus,
        ].join(' ').toLowerCase();
        if (!searchableContent.includes(term)) return false;
      }
      return true;
    });

    return combinedLog.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [isPageLoading, allHistory, allDeployments, filters, canViewPage]);


  if (authLoading || (isPageLoading && canViewPage)) {
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
                    {[...Array(5)].map((_, i) => <Skeleton key={`audit-skel-${i}`} className="h-12 w-full" />)}
                </CardContent>
            </Card>
        </div>
    );
  }
  
  if (!canViewPage && !authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">This page is for admin or superuser users only.</p>
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
        users={serviceUsers}
        isLoading={isPageLoading}
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

