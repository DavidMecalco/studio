
"use client";

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/dashboard/kpi-card'; // Re-use for consistency
import { AnalyticsFilterBar, type AnalyticsFilters } from '@/components/analytics/analytics-filter-bar';
import { TicketsByStatusChart } from '@/components/analytics/charts/tickets-by-status-chart';
import { CommitsOverTimeChart } from '@/components/analytics/charts/commits-over-time-chart';
import { DeploymentsByEnvironmentChart } from '@/components/analytics/charts/deployments-by-environment-chart';
import { TicketsByPriorityChart } from '@/components/analytics/charts/tickets-by-priority-chart';
import { TechnicianActivityChart } from '@/components/analytics/charts/technician-activity-chart';
import { ComponentTypeFrequencyChart } from '@/components/analytics/charts/component-type-frequency-chart';

import { getJiraTickets, type JiraTicket, type JiraTicketProvider } from '@/services/jira';
import { getGitHubCommits, type GitHubCommit } from '@/services/github';
import { getDeploymentLogs, type DeploymentLogEntry } from '@/services/deployment';
import { getUsers, type User as ServiceUser } from '@/services/users';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart as AnalyticsIcon, Download, AlertCircle, CheckCircle2, ClipboardList, GitMerge, Users, ServerIcon, PieChart, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { subDays, format, parseISO, isWithinInterval } from 'date-fns';


interface AnalyticsData {
  totalTickets: number;
  ticketsInProgress: number;
  ticketsClosed: number;
  totalCommits: number;
  totalDeployments: number;
  ticketsByStatus: { name: string; value: number }[];
  commitsOverTime: { date: string; count: number }[];
  deploymentsByEnv: { name: string; value: number }[];
  ticketsByPriority: { name: string; value: number }[];
  technicianActivity: { name: string; ticketsResolved: number; commitsMade: number }[];
  componentFrequency: { name: string; value: number }[];
  clients: JiraTicketProvider[]; // For filter
  environments: string[]; // For filter
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [allServiceUsers, setAllServiceUsers] = useState<ServiceUser[]>([]);
  const [allTickets, setAllTickets] = useState<JiraTicket[]>([]);
  const [allCommits, setAllCommits] = useState<GitHubCommit[]>([]);
  const [allDeployments, setAllDeployments] = useState<DeploymentLogEntry[]>([]);

  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    dateTo: format(new Date(), 'yyyy-MM-dd'),
    selectedUserId: 'all',
    selectedStatus: 'all',
    selectedClient: 'all',
    selectedEnvironment: 'all',
  });

  const canViewPage = user?.role === 'superuser';

  useEffect(() => {
    async function fetchData() {
      if (authLoading || !canViewPage) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [tickets, commits, deployments, serviceUsers] = await Promise.all([
          getJiraTickets(),
          getGitHubCommits("ALL_PROJECTS"),
          getDeploymentLogs(),
          getUsers()
        ]);
        setAllTickets(tickets);
        setAllCommits(commits);
        setAllDeployments(deployments);
        setAllServiceUsers(serviceUsers);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        toast({ title: "Error", description: "Failed to load analytics data.", variant: "destructive" });
      }
      setIsLoading(false);
    }
    if (canViewPage) {
        fetchData();
    } else if (!authLoading) { // If auth is done and user still cannot view
        setIsLoading(false);
    }
  }, [authLoading, canViewPage, toast]);

  const processedData = useMemo((): AnalyticsData | null => {
    if (isLoading || allTickets.length === 0 || !canViewPage) return null;

    const dateFrom = filters.dateFrom ? parseISO(filters.dateFrom) : null;
    const dateTo = filters.dateTo ? parseISO(filters.dateTo) : null;

    const dateInterval = dateFrom && dateTo ? { start: dateFrom, end: dateTo } : null;

    const filteredTickets = allTickets.filter(t => {
      const ticketDate = t.lastUpdated ? parseISO(t.lastUpdated) : parseISO(t.history[0].timestamp);
      if (dateInterval && !isWithinInterval(ticketDate, dateInterval)) return false;
      if (filters.selectedUserId !== 'all' && t.assigneeId !== filters.selectedUserId) return false;
      if (filters.selectedStatus !== 'all' && t.status !== filters.selectedStatus) return false;
      if (filters.selectedClient !== 'all' && t.provider !== filters.selectedClient) return false;
      // Environment filter applies to deployments, not directly to tickets here
      return true;
    });

    const filteredCommits = allCommits.filter(c => {
      const commitDate = parseISO(c.date);
      if (dateInterval && !isWithinInterval(commitDate, dateInterval)) return false;
      if (filters.selectedUserId !== 'all' && c.author !== allServiceUsers.find(u => u.id === filters.selectedUserId)?.name) return false; // Map ID to name
       // Client/status/env don't directly apply to commits without linking through tickets
      return true;
    });
    
    const filteredDeployments = allDeployments.filter(d => {
      const deploymentDate = parseISO(d.timestamp);
      if (dateInterval && !isWithinInterval(deploymentDate, dateInterval)) return false;
      if (filters.selectedUserId !== 'all' && d.userId !== filters.selectedUserId) return false;
      if (filters.selectedEnvironment !== 'all' && d.environment !== filters.selectedEnvironment) return false;
      // Client filter might apply if deployments are linked to client-specific tickets/projects
      if (filters.selectedClient !== 'all') {
        const clientTickets = allTickets.filter(t => t.provider === filters.selectedClient).map(t => t.id);
        if (!d.ticketIds?.some(tid => clientTickets.includes(tid))) return false;
      }
      return true;
    });


    const ticketsByStatus = ['Abierto', 'Pendiente', 'En Progreso', 'Resuelto', 'Cerrado', 'En espera del visto bueno'].map(status => ({
      name: status,
      value: filteredTickets.filter(t => t.status === status).length,
    }));

    const commitsMap = new Map<string, number>();
    filteredCommits.forEach(commit => {
      const dateStr = format(parseISO(commit.date), 'yyyy-MM-dd');
      commitsMap.set(dateStr, (commitsMap.get(dateStr) || 0) + 1);
    });
    const commitsOverTime = Array.from(commitsMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const deploymentsByEnv = Array.from(
      filteredDeployments.reduce((acc, curr) => {
        acc.set(curr.environment, (acc.get(curr.environment) || 0) + 1);
        return acc;
      }, new Map<string, number>()),
      ([name, value]) => ({ name, value })
    );
    
    const ticketsByPriority = ['Alta', 'Media', 'Baja'].map(priority => ({
        name: priority,
        value: filteredTickets.filter(t => t.priority === priority).length
    }));

    const techActivityMap = new Map<string, { ticketsResolved: number; commitsMade: number }>();
    allServiceUsers.forEach(su => techActivityMap.set(su.id, { ticketsResolved: 0, commitsMade: 0 }));

    filteredTickets.forEach(t => {
        if (t.assigneeId && (t.status === 'Resuelto' || t.status === 'Cerrado')) {
            const activity = techActivityMap.get(t.assigneeId);
            if (activity) activity.ticketsResolved += 1;
        }
    });
    filteredCommits.forEach(c => {
        // Assuming commit.author is the user's *name*. We need to map it back to ID or use name directly.
        // For simplicity, if selectedUserId is 'all', we group by author name. If specific user, only their commits.
        const authorKey = allServiceUsers.find(u => u.name === c.author)?.id || c.author; // Try to map to ID
        const activity = techActivityMap.get(authorKey);
        if (activity) activity.commitsMade += 1;
        else if (filters.selectedUserId === 'all') techActivityMap.set(authorKey, { ticketsResolved: 0, commitsMade: 1});
    });
     const technicianActivity = Array.from(techActivityMap.entries())
        .map(([userId, data]) => ({
            name: allServiceUsers.find(u => u.id === userId)?.name || userId, // Display name
            ...data
        }))
        .filter(item => item.ticketsResolved > 0 || item.commitsMade > 0);


    const componentFreqMap = new Map<string, number>();
    filteredDeployments.forEach(d => {
        d.filesDeployed.forEach(f => {
            componentFreqMap.set(f.type, (componentFreqMap.get(f.type) || 0) + 1);
        });
    });
    const componentFrequency = Array.from(componentFreqMap.entries())
        .map(([name, value]) => ({ name, value }));


    return {
      totalTickets: filteredTickets.length,
      ticketsInProgress: filteredTickets.filter(t => t.status === 'En Progreso').length,
      ticketsClosed: filteredTickets.filter(t => t.status === 'Cerrado' || t.status === 'Resuelto').length,
      totalCommits: filteredCommits.length,
      totalDeployments: filteredDeployments.length,
      ticketsByStatus,
      commitsOverTime,
      deploymentsByEnv,
      ticketsByPriority,
      technicianActivity,
      componentFrequency,
      clients: ['TLA', 'FEMA'],
      environments: ['DEV', 'QA', 'PROD', 'Staging', 'Other']
    };
  }, [isLoading, allTickets, allCommits, allDeployments, allServiceUsers, filters, canViewPage]);

  const handleExport = (format: 'pdf' | 'json') => {
    toast({
        title: `Export ${format.toUpperCase()} (Simulated)`,
        description: `Simulating export of analytics data as ${format.toUpperCase()}. This feature is under development.`,
    });
  };
  const handleAlertCheck = () => {
    toast({
        title: `Alert Check (Simulated)`,
        description: `No critical alerts detected. System operating normally. (This is a simulated alert check)`,
        variant: "default"
    });
  };

  if (authLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3" /> <Skeleton className="h-4 w-2/3" />
        <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}</div>
      </div>
    );
  }
  
  if (!canViewPage && !authLoading) { // Check after auth loading is complete
     return (
        <div className="space-y-8 text-center py-10">
            <AnalyticsIcon className="h-16 w-16 mx-auto text-destructive" />
            <h1 className="text-2xl font-semibold">Access Denied</h1>
            <p className="text-muted-foreground">This analytics page is for superuser users only.</p>
        </div>
     );
  }

  if (isLoading || !processedData) { // This covers initial loading for authorized users
     return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-1/3" />
        </div>
        <AnalyticsFilterBar 
            filters={filters} 
            onFiltersChange={setFilters} 
            users={allServiceUsers} 
            clients={['TLA', 'FEMA']} 
            environments={['DEV', 'QA', 'PROD', 'Staging', 'Other']} 
            isLoading={true}
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[...Array(5)].map((_, i) => <KpiCardSkeleton key={`kpi-skel-${i}`} />)}
        </div>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <ChartSkeleton title="Tickets by Status" />
            <ChartSkeleton title="Commits Over Time" />
        </div>
         <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <ChartSkeleton title="Technician Activity" />
            <ChartSkeleton title="Deployments by Environment" />
        </div>
      </div>
    );
  }
  
  const { 
    totalTickets, ticketsInProgress, ticketsClosed, totalCommits, totalDeployments, 
    ticketsByStatus, commitsOverTime, deploymentsByEnv, ticketsByPriority,
    technicianActivity, componentFrequency, clients, environments
  } = processedData;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <AnalyticsIcon className="h-8 w-8 text-primary" /> Metrics & Analytics
          </h1>
          <p className="text-muted-foreground">
            Visualize performance, track development cycles, and analyze team efficiency.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleExport('pdf')}><Download className="mr-2 h-4 w-4" /> PDF</Button>
            <Button variant="outline" onClick={() => handleExport('json')}><Download className="mr-2 h-4 w-4" /> JSON</Button>
            <Button variant="secondary" onClick={handleAlertCheck}><AlertCircle className="mr-2 h-4 w-4" /> Check Alerts</Button>
        </div>
      </div>

      <AnalyticsFilterBar 
        filters={filters} 
        onFiltersChange={setFilters} 
        users={allServiceUsers}
        clients={clients}
        environments={environments}
        isLoading={isLoading}
      />

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard title="Total Tickets" value={totalTickets} icon={<Ticket className="h-5 w-5 text-accent" />} description="Tickets within selected period." />
        <KpiCard title="Tickets In Progress" value={ticketsInProgress} icon={<ClipboardList className="h-5 w-5 text-yellow-500" />} />
        <KpiCard title="Tickets Closed" value={ticketsClosed} icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} />
        <KpiCard title="Total Commits" value={totalCommits} icon={<GitMerge className="h-5 w-5 text-blue-500" />} />
        <KpiCard title="Total Deployments" value={totalDeployments} icon={<ServerIcon className="h-5 w-5 text-purple-500" />} />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <TicketsByStatusChart data={ticketsByStatus} />
        <CommitsOverTimeChart data={commitsOverTime} />
      </div>
       <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <TicketsByPriorityChart data={ticketsByPriority} />
        <DeploymentsByEnvironmentChart data={deploymentsByEnv} />
      </div>
       <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <TechnicianActivityChart data={technicianActivity} />
        <ComponentTypeFrequencyChart data={componentFrequency} />
      </div>

       <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><AlertCircle className="h-5 w-5 text-orange-500" /> Simulated SLA & Backlog Alerts</CardTitle>
            <CardDescription>This section demonstrates where intelligent alerts based on data trends would appear. (Feature under development)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-md bg-muted/50">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-1 flex-shrink-0" />
                <div>
                    <h4 className="font-semibold text-yellow-700">Potential SLA Breach Risk</h4>
                    <p className="text-sm text-muted-foreground">3 high-priority tickets have been 'In Progress' for over 5 days. Consider reviewing.</p>
                </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-md bg-muted/50">
                <AlertCircle className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                <div>
                    <h4 className="font-semibold text-red-700">High Backlog Growth</h4>
                    <p className="text-sm text-muted-foreground">Open tickets for 'FEMA' client increased by 25% this week. Resource allocation may be needed.</p>
                </div>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}


const KpiCardSkeleton = () => (
    <Card className="shadow-sm rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-5" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-6 w-12 mb-1" />
            <Skeleton className="h-3 w-32" />
        </CardContent>
    </Card>
);

const ChartSkeleton = ({title}: {title: string}) => (
    <Card>
        <CardHeader>
            <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
            <CardDescription><Skeleton className="h-4 w-3/4" /></CardDescription>
        </CardHeader>
        <CardContent>
            <Skeleton className="h-60 w-full" />
        </CardContent>
    </Card>
);

