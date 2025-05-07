"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, Search, Filter, Download } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import type { JiraTicketHistoryEntry } from '@/services/jira';
import type { DeploymentLogEntry } from '@/services/deployment';
import { getAllAuditableActions } from '@/services/deployment'; // Combined getter
import { getUsers, type User } from '@/services/users';
import { TicketHistoryItem } from '@/components/tickets/ticket-history-item'; // Re-use for consistent display
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';


type CombinedLogEntry = (JiraTicketHistoryEntry & { type: 'TicketEvent', eventId: string, ticketId?: string }) | 
                        (DeploymentLogEntry & { type: 'DeploymentEvent', eventId: string, action: string });


const actionTypes = ['All', 'Status Changed', 'Commit Added', 'Deployment Recorded', 'Created', 'Assignee Changed'];

export default function AuditLogPage() {
  const [logs, setLogs] = useState<CombinedLogEntry[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    user: 'all',
    actionType: 'All',
    dateFrom: '',
    dateTo: '',
    ticketIdSearch: '',
  });

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [fetchedLogs, fetchedUsers] = await Promise.all([
          getAllAuditableActions() as Promise<CombinedLogEntry[]>,
          getUsers()
        ]);
        setLogs(fetchedLogs);
        setAllUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching audit data:", error);
        toast({ title: "Error", description: "Failed to load audit logs.", variant: "destructive" });
      }
      setIsLoading(false);
    }
    fetchData();
  }, [toast]);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };
  
  const handleExport = (format: 'pdf' | 'json') => {
    toast({
        title: `Export ${format.toUpperCase()}`,
        description: `Simulating export of audit logs as ${format.toUpperCase()}. This feature is under development.`,
    });
  }

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const logDate = parseISO(log.timestamp);
      const dateFromValid = filters.dateFrom && isValid(parseISO(filters.dateFrom));
      const dateToValid = filters.dateTo && isValid(parseISO(filters.dateTo));

      if (filters.user !== 'all' && log.userId !== filters.user) return false;
      if (filters.actionType !== 'All' && !log.action.includes(filters.actionType)) return false;
      if (dateFromValid && logDate < parseISO(filters.dateFrom)) return false;
      if (dateToValid && logDate > parseISO(filters.dateTo)) return false;
      if (filters.ticketIdSearch && log.type === 'TicketEvent' && log.ticketId && !log.ticketId.toLowerCase().includes(filters.ticketIdSearch.toLowerCase())) return false;
      if (filters.ticketIdSearch && log.type === 'DeploymentEvent' && log.ticketIds && !log.ticketIds.some(tid => tid.toLowerCase().includes(filters.ticketIdSearch.toLowerCase()))) return false;

      return true;
    });
  }, [logs, filters]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-10 w-24" />
        </div>
        <Card>
            <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
                <Skeleton className="h-10 w-1/4" />
                <Skeleton className="h-64 w-full" />
            </CardContent>
        </Card>
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
                View all system actions, ticket changes, and deployment history.
            </p>
        </div>
         <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('pdf')} disabled>
                <Download className="mr-2 h-4 w-4" /> Export PDF (WIP)
            </Button>
            <Button variant="outline" onClick={() => handleExport('json')} disabled>
                <Download className="mr-2 h-4 w-4" /> Export JSON (WIP)
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="userFilter" className="text-sm font-medium">Usuario</label>
              <Select value={filters.user} onValueChange={(val) => handleFilterChange('user', val)}>
                <SelectTrigger id="userFilter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Usuarios</SelectItem>
                  {allUsers.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="actionTypeFilter" className="text-sm font-medium">Tipo de Acción</label>
              <Select value={filters.actionType} onValueChange={(val) => handleFilterChange('actionType', val)}>
                <SelectTrigger id="actionTypeFilter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {actionTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="dateFromFilter" className="text-sm font-medium">Desde Fecha</label>
              <Input id="dateFromFilter" type="date" value={filters.dateFrom} onChange={(e) => handleFilterChange('dateFrom', e.target.value)} />
            </div>
            <div>
              <label htmlFor="dateToFilter" className="text-sm font-medium">Hasta Fecha</label>
              <Input id="dateToFilter" type="date" value={filters.dateTo} onChange={(e) => handleFilterChange('dateTo', e.target.value)} />
            </div>
          </div>
           <div>
              <label htmlFor="ticketIdSearch" className="text-sm font-medium">Buscar por ID de Ticket</label>
              <div className="flex gap-2">
                <Input 
                    id="ticketIdSearch" 
                    type="text" 
                    placeholder="Ej: MAX-123" 
                    value={filters.ticketIdSearch} 
                    onChange={(e) => handleFilterChange('ticketIdSearch', e.target.value)} 
                />
                <Button variant="outline" size="icon" onClick={() => { /* Can add specific search logic if needed */ }}>
                    <Search className="h-4 w-4"/>
                </Button>
              </div>
            </div>
          {/* Reset filters button could be added here */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log Entries</CardTitle>
          <CardDescription>Mostrando {filteredLogs.length} de {logs.length} entradas.</CardDescription>
        </CardHeader>
        <CardContent>
            {filteredLogs.length > 0 ? (
                 <ul className="space-y-0 divide-y divide-border"> {/* Using TicketHistoryItem for display */}
                    {filteredLogs.map((logEntry, index) => {
                        // Adapt JiraTicketHistoryEntry for TicketHistoryItem
                        const historyEntryAdapter = {
                            id: logEntry.eventId,
                            timestamp: logEntry.timestamp,
                            userId: logEntry.userId,
                            action: logEntry.action,
                            details: (logEntry as any).details || (logEntry as any).message || '',
                            fromStatus: (logEntry as any).fromStatus,
                            toStatus: (logEntry as any).toStatus,
                            comment: (logEntry as any).comment,
                            commitSha: (logEntry as any).commitSha,
                            deploymentId: (logEntry as any).deploymentId,
                            ticketId: (logEntry as any).ticketId || (logEntry.type === 'DeploymentEvent' && logEntry.ticketIds ? logEntry.ticketIds[0] : undefined), // Show first ticketId for deployments
                        };
                        return (
                            <TicketHistoryItem 
                                key={`${logEntry.type}-${logEntry.eventId}-${index}`} 
                                entry={historyEntryAdapter} 
                                isLastItem={index === filteredLogs.length - 1} 
                            />
                        );
                    })}
                </ul>
            ) : (
                 <p className="text-muted-foreground text-center py-6">No hay entradas de auditoría que coincidan con los filtros seleccionados.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}