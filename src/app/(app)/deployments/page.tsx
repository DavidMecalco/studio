
"use client";

import { useEffect, useState } from 'react';
import { DeploymentForm } from '@/components/deployments/deployment-form';
import { DeploymentList } from '@/components/deployments/deployment-list';
import { getDeploymentLogs, type DeploymentLogEntry } from '@/services/deployment';
import { getUsers, type UserDoc as ServiceUser } from '@/services/users'; // Changed User to UserDoc
import { getJiraTickets, type JiraTicket } from '@/services/jira';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Layers, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function DeploymentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [deploymentLogs, setDeploymentLogs] = useState<DeploymentLogEntry[]>([]);
  const [serviceUsers, setServiceUsers] = useState<ServiceUser[]>([]); // Renamed users to serviceUsers
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true); // Renamed isLoading to avoid conflict

  const canViewPage = user?.role === 'admin' || user?.role === 'superuser';

  useEffect(() => {
    async function fetchData() {
      if (authLoading || !canViewPage || !user) { // Ensure user is available
        setIsPageLoading(false);
        return;
      }
      setIsPageLoading(true);
      try {
        const [logs, fetchedServiceUsers, jiraTickets] = await Promise.all([
          getDeploymentLogs(),
          getUsers(),
          getJiraTickets() 
        ]);
        setDeploymentLogs(logs);
        setServiceUsers(fetchedServiceUsers);
        setTickets(jiraTickets);
      } catch (error) {
        console.error("Error fetching deployment data:", error);
      }
      setIsPageLoading(false);
    }
    if (canViewPage && !authLoading && user) { // Trigger fetch when auth is done and user is present
      fetchData();
    } else if (!authLoading) {
        setIsPageLoading(false);
    }
  }, [user, authLoading, canViewPage]);
  
  const handleDeploymentCreated = (newLog: DeploymentLogEntry) => {
    setDeploymentLogs(prevLogs => [newLog, ...prevLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  if (authLoading || (isPageLoading && canViewPage)) { // Combined loading check
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
          <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
        <Separator />
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
          <CardContent><Skeleton className="h-60 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  if (!canViewPage && !authLoading) { // Check after auth completes
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
            <Layers className="h-8 w-8 text-primary" /> Deployment Logs & Management
          </h1>
          <p className="text-muted-foreground">
            Log new deployments and view the history of all deployments.
          </p>
        </div>
      </div>

      <DeploymentForm 
        users={serviceUsers} 
        tickets={tickets} 
        onDeploymentCreated={handleDeploymentCreated} 
      />

      <Separator />

      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle>Deployment History</CardTitle>
          <CardDescription>Browse all recorded deployments.</CardDescription>
        </CardHeader>
        <CardContent>
          <DeploymentList deploymentLogs={deploymentLogs} users={serviceUsers} />
        </CardContent>
      </Card>
    </div>
  );
}
