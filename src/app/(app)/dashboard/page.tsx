
"use client"; // Make this a client component to use useAuth

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Ticket, Github, Server, CheckCircle2, ClipboardList, GitMerge, Briefcase, ListChecks, LineChart as AnalyticsIcon, Users, Settings } from 'lucide-react';
import Image from 'next/image';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { TicketManagementCard } from '@/components/dashboard/ticket-management-card';
import { getJiraTickets, type JiraTicket } from '@/services/jira';
import { getGitHubCommits, type GitHubCommit } from '@/services/github';
import { getUsers, type User as ServiceUser } from '@/services/users';
import { subWeeks, isAfter } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardData {
  jiraTickets: JiraTicket[]; // Tickets for TicketManagementCard / Client view
  allJiraTickets?: JiraTicket[]; // All tickets for admin/superuser KPIs, undefined for client
  githubCommits: GitHubCommit[];
  users: ServiceUser[];
  closedTicketsCount?: number; // For admin/superuser KPI
  pendingTicketsCount?: number; // For admin/superuser KPI
  commitsLastWeekCount?: number; // For admin/superuser KPI
  myActiveTicketsCount?: number; // For client KPI
}

async function fetchDashboardData(userId?: string, userRole?: 'admin' | 'client' | 'superuser'): Promise<DashboardData | null> {
  try {
    const [allJiraTicketsFromService, githubCommits, users] = await Promise.all([
      getJiraTickets(), 
      getGitHubCommits("ALL_PROJECTS"),
      getUsers(),
    ]);

    let dashboardResult: DashboardData = {
        jiraTickets: [], // Will be populated based on role
        githubCommits,
        users,
    };

    if (userRole === 'admin' || userRole === 'superuser') {
      dashboardResult.allJiraTickets = allJiraTicketsFromService;
      dashboardResult.jiraTickets = allJiraTicketsFromService; // Admin/Superuser sees all tickets in management card
      dashboardResult.closedTicketsCount = allJiraTicketsFromService.filter(
        ticket => ticket.status === 'Cerrado' || ticket.status === 'Resuelto'
      ).length;
      dashboardResult.pendingTicketsCount = allJiraTicketsFromService.filter(
        ticket => ['Abierto', 'Pendiente', 'En Progreso', 'En espera del visto bueno'].includes(ticket.status)
      ).length;
      const oneWeekAgo = subWeeks(new Date(), 1);
      dashboardResult.commitsLastWeekCount = githubCommits.filter(
        commit => isAfter(new Date(commit.date), oneWeekAgo)
      ).length;
    } else if (userRole === 'client' && userId) {
      const clientTickets = allJiraTicketsFromService.filter(ticket => ticket.requestingUserId === userId);
      dashboardResult.jiraTickets = clientTickets; // Client sees their tickets
      dashboardResult.myActiveTicketsCount = clientTickets.filter(
          ticket => ticket.status !== 'Cerrado' && ticket.status !== 'Resuelto'
      ).length;
    }
    
    return dashboardResult;
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return null;
  }
}


export default function DashboardOverviewPage() {
  const { user, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      setIsLoading(true);
      fetchDashboardData(user.id, user.role).then(data => {
        setDashboardData(data);
        setIsLoading(false);
      });
    } else if (!authLoading && !user) {
        setIsLoading(false); // No user, stop loading
    }
  }, [user, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Skeleton className="h-8 w-72 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <KpiCardSkeleton key={i}/>)}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(user?.role === 'client' ? 1 : (user?.role === 'superuser' ? 4 : 3))].map((_, i) => <NavCardSkeleton key={i}/>)}
        </div>
        {(user?.role === 'admin' || user?.role === 'superuser') && <TicketManagementCardSkeleton />}
      </div>
    );
  }
  
  if (!dashboardData) {
    return <p>Error loading dashboard data. Please try again later.</p>;
  }

  const { 
    jiraTickets, 
    users, 
    closedTicketsCount, 
    pendingTicketsCount, 
    commitsLastWeekCount,
    myActiveTicketsCount
  } = dashboardData;

  const isAdmin = user?.role === 'admin';
  const isSuperUser = user?.role === 'superuser';
  const isClient = user?.role === 'client';


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Bienvenido al Portal Maximo</h1>
          <p className="text-muted-foreground">
            {isClient 
              ? "Gestione sus solicitudes y seguimiento de tickets." 
              : isAdmin ? "Su centro de operaciones para la gestión de versiones de Maximo."
              : isSuperUser ? "Portal de administración y configuración del sistema Maximo."
              : "Su panel de control central."}
          </p>
        </div>
      </div>

      {/* KPIs Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(isAdmin || isSuperUser) && (
          <>
            <KpiCard
              title="Tickets Cerrados (Global)"
              value={closedTicketsCount ?? 0}
              icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
              description="Total de tickets completados."
              className="shadow-lg rounded-xl"
            />
            <KpiCard
              title="Tickets Pendientes (Global)"
              value={pendingTicketsCount ?? 0}
              icon={<ClipboardList className="h-5 w-5 text-yellow-500" />}
              description="Tickets activos o esperando acción."
              className="shadow-lg rounded-xl"
            />
            <KpiCard
              title="Commits (Última Semana)"
              value={commitsLastWeekCount ?? 0}
              icon={<GitMerge className="h-5 w-5 text-blue-500" />}
              description="Actividad reciente en repositorios."
              className="shadow-lg rounded-xl"
            />
          </>
        )}
        {isClient && typeof myActiveTicketsCount !== 'undefined' && (
           <KpiCard
            title="Mis Tickets Activos"
            value={myActiveTicketsCount}
            icon={<Ticket className="h-5 w-5 text-accent" />}
            description="Tickets que ha enviado y están activos."
            className="shadow-lg rounded-xl"
          />
        )}
      </div>

      {/* Navigation Cards Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isClient && (
            <Card className="bg-card shadow-lg rounded-xl hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-xl gap-2">
                  <ListChecks className="h-6 w-6 text-accent" />
                  Mis Tickets
                </CardTitle>
                <CardDescription>Vea y gestione sus tickets enviados.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Acceda al historial de sus tickets y cree nuevas solicitudes.
                </p>
                <Button asChild>
                  <Link href="/my-tickets">
                    Ir a Mis Tickets <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
        )}
        {(isAdmin || isSuperUser) && (
          <>
            <Card className="bg-card shadow-lg rounded-xl hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-xl gap-2">
                  <Ticket className="h-6 w-6 text-accent" />
                  Tickets de Jira
                </CardTitle>
                <CardDescription>Seguimiento de incidencias y progreso.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Vea, gestione y monitorice los tickets de Jira relacionados con los proyectos Maximo.
                </p>
                <Button asChild>
                  <Link href="/jira">
                    Ir a Tickets de Jira <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-lg rounded-xl hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-xl gap-2">
                  <Github className="h-6 w-6 text-accent" />
                  Commits de GitHub
                </CardTitle>
                <CardDescription>Monitorice cambios en el código.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Revise los commits recientes y siga el progreso del desarrollo.
                </p>
                <Button asChild>
                  <Link href="/github">
                    Ver Commits de GitHub <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-lg rounded-xl hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-xl gap-2">
                  <Server className="h-6 w-6 text-accent" />
                  Gestión de Maximo
                </CardTitle>
                <CardDescription>Suba configuraciones y gestione archivos.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Acceda a herramientas para subir configuraciones de Maximo.
                </p>
                <Button asChild>
                  <Link href="/maximo">
                    Gestionar Maximo <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            {isSuperUser && (
                <>
                 <Card className="bg-card shadow-lg rounded-xl hover:shadow-xl transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center text-xl gap-2">
                        <AnalyticsIcon className="h-6 w-6 text-accent" />
                        Analytics
                        </CardTitle>
                        <CardDescription>Visualice métricas y rendimiento.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                        Acceda a los dashboards de analítica y reportes del sistema.
                        </p>
                        <Button asChild>
                        <Link href="/analytics">
                            Ir a Analytics <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                        </Button>
                    </CardContent>
                </Card>
                {/* Placeholder for future User Management card for SuperUser */}
                {/* <Card className="bg-card shadow-lg rounded-xl hover:shadow-xl transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center text-xl gap-2">
                        <Users className="h-6 w-6 text-accent" />
                        User Management
                        </CardTitle>
                        <CardDescription>Manage client and technician accounts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                        Create, edit, and manage user accounts and permissions.
                        </p>
                        <Button asChild variant="secondary" disabled> 
                        <Link href="#"> 
                            Manage Users (Soon) <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                        </Button>
                    </CardContent>
                </Card> */}
                </>
            )}
          </>
        )}
      </div>

      {/* Ticket Management Section - Only for Admin/SuperUser */}
      {(isAdmin || isSuperUser) && (
        <TicketManagementCard tickets={jiraTickets} users={users} defaultIcon={<Briefcase className="h-6 w-6 text-primary" />} />
      )}
      
      {/* Image Card Section - can be kept or removed based on preference */}
      <Card className="bg-card shadow-lg rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="relative h-64 w-full">
            <Image
              src="https://picsum.photos/1200/400"
              alt="Abstract technology background"
              fill 
              style={{objectFit:"cover"}} 
              priority 
              data-ai-hint="technology abstract"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6">
              <h2 className="text-2xl font-semibold text-white">
                Manténgase al día con el Portal de Versiones Maximo
              </h2>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


// Skeleton components for loading state
const KpiCardSkeleton = () => (
    <Card className="shadow-lg rounded-xl">
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

const NavCardSkeleton = () => (
    <Card className="bg-card shadow-lg rounded-xl">
        <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-1" />
            <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-10 w-32" />
        </CardContent>
    </Card>
);

const TicketManagementCardSkeleton = () => (
    <Card className="shadow-lg rounded-xl">
        <CardHeader>
            <Skeleton className="h-7 w-1/2 mb-1" />
            <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-1/3" />
        </CardContent>
    </Card>
);

