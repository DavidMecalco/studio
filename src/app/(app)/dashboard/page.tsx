
"use client"; 

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Ticket, Github, Server, CheckCircle2, ClipboardList, GitMerge, Briefcase, ListChecks, LineChart as AnalyticsIcon, Users, Settings, PieChartIcon } from 'lucide-react';
import Image from 'next/image';
import { KpiCard } from '@/components/dashboard/kpi-card';
// import { TicketManagementCard } from '@/components/dashboard/ticket-management-card'; // This component was removed
import { getTickets, type Ticket as LocalTicket } from '@/services/tickets'; // Updated import
import { getGitHubCommits, type GitHubCommit } from '@/services/github';
import { getUsers, type UserDoc as ServiceUser } from '@/services/users'; 
import { subWeeks, isAfter, format, parseISO } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { MyTicketsOverTimeChart } from '@/components/analytics/charts/my-tickets-over-time-chart';

interface DashboardData {
  tickets: LocalTicket[]; // Updated type
  allTickets?: LocalTicket[]; // Updated type
  githubCommits: GitHubCommit[];
  users: ServiceUser[];
  
  closedTicketsCount?: number; 
  pendingTicketsCount?: number; 
  commitsLastWeekCount?: number; 
  
  myActiveTicketsCount?: number;
  myTotalTicketsCount?: number; 
  myClosedTicketsCount?: number; 
  myTicketsOverTime?: { date: string; count: number }[]; 
}

async function fetchDashboardData(userId?: string, userRole?: 'admin' | 'client' | 'superuser'): Promise<DashboardData | null> {
  try {
    const [allTicketsFromService, githubCommits, users] = await Promise.all([
      getTickets(), // Use local getTickets
      getGitHubCommits("ALL_PROJECTS"), 
      getUsers(), 
    ]);

    let dashboardResult: DashboardData = {
        tickets: [], 
        githubCommits,
        users,
    };

    if (userRole === 'admin' || userRole === 'superuser') {
      dashboardResult.allTickets = allTicketsFromService;
      dashboardResult.tickets = allTicketsFromService;
      dashboardResult.closedTicketsCount = allTicketsFromService.filter(
        ticket => ticket.status === 'Cerrado' || ticket.status === 'Resuelto'
      ).length;
      dashboardResult.pendingTicketsCount = allTicketsFromService.filter(
        ticket => ['Abierto', 'Pendiente', 'En Progreso', 'En espera del visto bueno', 'Reabierto'].includes(ticket.status)
      ).length;
      const oneWeekAgo = subWeeks(new Date(), 1);
      dashboardResult.commitsLastWeekCount = githubCommits.filter(
        commit => isAfter(new Date(commit.date), oneWeekAgo)
      ).length;
    } else if (userRole === 'client' && userId) {
      const clientTickets = allTicketsFromService.filter(ticket => ticket.requestingUserId === userId);
      dashboardResult.tickets = clientTickets;
      dashboardResult.myActiveTicketsCount = clientTickets.filter(
          ticket => ticket.status !== 'Cerrado' && ticket.status !== 'Resuelto'
      ).length;
      dashboardResult.myTotalTicketsCount = clientTickets.length;
      dashboardResult.myClosedTicketsCount = clientTickets.filter(
        ticket => ticket.status === 'Cerrado' || ticket.status === 'Resuelto'
      ).length;

      const ticketsByCreationDate = new Map<string, number>();
      clientTickets.forEach(ticket => {
        const creationEntry = ticket.history.find(h => h.action === 'Created');
        const creationDateStr = creationEntry 
          ? format(parseISO(creationEntry.timestamp), 'yyyy-MM-dd') 
          : format(parseISO(ticket.history[0]?.timestamp || new Date(0).toISOString()), 'yyyy-MM-dd');
        ticketsByCreationDate.set(creationDateStr, (ticketsByCreationDate.get(creationDateStr) || 0) + 1);
      });
      dashboardResult.myTicketsOverTime = Array.from(ticketsByCreationDate.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
  const [isPageLoading, setIsPageLoading] = useState(true); 

  useEffect(() => {
    if (!authLoading && user) {
      setIsPageLoading(true);
      fetchDashboardData(user.id, user.role).then(data => {
        setDashboardData(data);
        setIsPageLoading(false);
      });
    } else if (!authLoading && !user) {
        setIsPageLoading(false); 
    }
  }, [user, authLoading]);

  if (authLoading || isPageLoading) {
    const isAdminOrSuperUser = user?.role === 'admin' || user?.role === 'superuser';
    const isClientUser = user?.role === 'client';
    const skeletonNavCardsCount = isClientUser ? 1 : (isAdminOrSuperUser ? (user.role === 'superuser' ? 4 : 3) : 0);
    
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Skeleton className="h-8 w-72 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <KpiCardSkeleton key={`kpi-skel-${i}`}/>)}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(skeletonNavCardsCount)].map((_, i) => <NavCardSkeleton key={`nav-skel-${i}`}/>)}
        </div>
        {/* TicketManagementCardSkeleton was here, but the component was removed */}
        {isClientUser && <ChartSkeleton />}
      </div>
    );
  }
  
  if (!dashboardData) {
    return <p className="text-center text-muted-foreground">Error loading dashboard data. Please try again later.</p>;
  }

  const { 
    tickets, // Renamed from jiraTickets
    users, 
    closedTicketsCount, 
    pendingTicketsCount, 
    commitsLastWeekCount,
    myActiveTicketsCount,
    myTotalTicketsCount,
    myClosedTicketsCount,
    myTicketsOverTime
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
        {isClient && (
          <>
            <KpiCard
              title="Mis Tickets Totales"
              value={myTotalTicketsCount ?? 0}
              icon={<Ticket className="h-5 w-5 text-accent" />}
              description="Total de tickets que ha enviado."
              className="shadow-lg rounded-xl"
            />
            <KpiCard
              title="Mis Tickets Activos"
              value={myActiveTicketsCount ?? 0}
              icon={<ClipboardList className="h-5 w-5 text-yellow-500" />}
              description="Tickets abiertos, en progreso o pendientes."
              className="shadow-lg rounded-xl"
            />
            <KpiCard
              title="Mis Tickets Cerrados"
              value={myClosedTicketsCount ?? 0}
              icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
              description="Tickets que han sido resueltos o cerrados."
              className="shadow-lg rounded-xl"
            />
          </>
        )}
      </div>

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
                  Tickets
                </CardTitle>
                <CardDescription>Seguimiento de incidencias y progreso.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Vea, gestione y monitorice los tickets relacionados con los proyectos Maximo.
                </p>
                <Button asChild>
                  <Link href="/tickets"> 
                    Ir a Tickets <ArrowRight className="ml-2 h-4 w-4" />
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
                </>
            )}
          </>
        )}
      </div>
      
      {isClient && myTicketsOverTime && (
        <MyTicketsOverTimeChart data={myTicketsOverTime} />
      )}

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

const ChartSkeleton = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-6 w-1/2 mb-1" />
            <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-60 w-full" />
        </CardContent>
    </Card>
);
