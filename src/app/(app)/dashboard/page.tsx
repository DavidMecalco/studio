
"use client"; 

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Ticket, Github, Server, CheckCircle2, ClipboardList, GitMerge, ListChecks, LineChart as AnalyticsIcon, Users, Settings, PieChartIcon, LayoutDashboard as DashboardIcon } from 'lucide-react';
import Image from 'next/image';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { getTickets, type Ticket as LocalTicket } from '@/services/tickets'; 
import { getGitHubCommits, type GitHubCommit } from '@/services/github';
import { getUsers, type UserDoc as ServiceUser } from '@/services/users'; 
import { subWeeks, isAfter, format, parseISO } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { MyTicketsOverTimeChart } from '@/components/analytics/charts/my-tickets-over-time-chart';

interface DashboardData {
  tickets: LocalTicket[]; 
  allTickets?: LocalTicket[]; 
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
      getTickets(), 
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
        <div className="pb-6 border-b">
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-5 w-1/2" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <KpiCardSkeleton key={`kpi-skel-${i}`}/>)}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(skeletonNavCardsCount)].map((_, i) => <NavCardSkeleton key={`nav-skel-${i}`}/>)}
        </div>
        {isClientUser && <ChartSkeleton />}
         <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }
  
  if (!dashboardData) {
    return <p className="text-center text-muted-foreground">Error loading dashboard data. Please try again later.</p>;
  }

  const { 
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

  const welcomeTitle = isClient 
      ? "Client Dashboard" 
      : isAdmin ? "Administrator Dashboard"
      : isSuperUser ? "Super User Dashboard"
      : "Maximo Version Portal";

  const welcomeDescription = isClient 
      ? "Manage your requests and track ticket progress." 
      : isAdmin ? "Your operations hub for Maximo version management."
      : isSuperUser ? "System administration and configuration portal."
      : "Your central control panel.";


  return (
    <div className="space-y-10">
      <section className="pb-8 border-b">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2 flex items-center gap-3">
          <DashboardIcon className="h-10 w-10 text-primary" />
          {welcomeTitle}
        </h1>
        <p className="text-xl text-muted-foreground">
          {welcomeDescription}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-6">Key Performance Indicators</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(isAdmin || isSuperUser) && (
            <>
              <KpiCard
                title="Global Closed Tickets"
                value={closedTicketsCount ?? 0}
                icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
                description="Total completed tickets."
                className="shadow-lg rounded-xl"
              />
              <KpiCard
                title="Global Pending Tickets"
                value={pendingTicketsCount ?? 0}
                icon={<ClipboardList className="h-5 w-5 text-yellow-500" />}
                description="Active tickets or awaiting action."
                className="shadow-lg rounded-xl"
              />
              <KpiCard
                title="Commits (Last Week)"
                value={commitsLastWeekCount ?? 0}
                icon={<GitMerge className="h-5 w-5 text-blue-500" />}
                description="Recent activity in repositories."
                className="shadow-lg rounded-xl"
              />
            </>
          )}
          {isClient && (
            <>
              <KpiCard
                title="My Total Tickets"
                value={myTotalTicketsCount ?? 0}
                icon={<Ticket className="h-5 w-5 text-accent" />}
                description="Total tickets you have submitted."
                className="shadow-lg rounded-xl"
              />
              <KpiCard
                title="My Active Tickets"
                value={myActiveTicketsCount ?? 0}
                icon={<ClipboardList className="h-5 w-5 text-yellow-500" />}
                description="Open, in-progress, or pending tickets."
                className="shadow-lg rounded-xl"
              />
              <KpiCard
                title="My Closed Tickets"
                value={myClosedTicketsCount ?? 0}
                icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
                description="Tickets that have been resolved or closed."
                className="shadow-lg rounded-xl"
              />
            </>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-6">Quick Access</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isClient && (
              <ActionCard 
                href="/my-tickets"
                icon={<ListChecks className="h-7 w-7 text-primary" />}
                title="My Tickets"
                description="View and manage your submitted tickets and create new requests."
              />
          )}
          {(isAdmin || isSuperUser) && (
            <>
              <ActionCard 
                href="/tickets"
                icon={<Ticket className="h-7 w-7 text-primary" />}
                title="Ticket Management"
                description="Monitor and manage all project-related tickets."
              />
              <ActionCard 
                href="/github"
                icon={<Github className="h-7 w-7 text-primary" />}
                title="GitHub Commits"
                description="Review recent code changes and track development progress."
              />
              <ActionCard 
                href="/maximo"
                icon={<Server className="h-7 w-7 text-primary" />}
                title="Maximo Configurations"
                description="Upload and manage Maximo configuration files and scripts."
              />
              
              {isSuperUser && (
                  <>
                    <ActionCard 
                        href="/analytics"
                        icon={<AnalyticsIcon className="h-7 w-7 text-primary" />}
                        title="Analytics Dashboard"
                        description="Access system metrics, performance reports, and data visualizations."
                    />
                    <ActionCard 
                        href="/user-management"
                        icon={<Users className="h-7 w-7 text-primary" />}
                        title="User Management"
                        description="Create and manage user accounts and their permissions."
                    />
                     <ActionCard 
                        href="/organization-management"
                        icon={<Settings className="h-7 w-7 text-primary" />}
                        title="Organization Setup"
                        description="Manage organizations and linked GitHub repositories."
                    />
                  </>
              )}
            </>
          )}
        </div>
      </section>
      
      {isClient && myTicketsOverTime && (
        <section>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-6">My Ticket Creation Trend</h2>
            <MyTicketsOverTimeChart data={myTicketsOverTime} />
        </section>
      )}

      <section>
        <Card className="bg-card shadow-xl rounded-xl overflow-hidden border-border">
          <CardContent className="p-0">
            <div className="relative h-72 w-full">
              <Image
                src="https://placehold.co/1200x400.png" 
                alt="Modern abstract technology background"
                fill 
                style={{objectFit:"cover"}} 
                priority 
                data-ai-hint="technology abstract"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-8">
                <h3 className="text-3xl font-semibold text-white mb-2">
                  Streamline Your Maximo Workflow
                </h3>
                <p className="text-lg text-primary-foreground/80 max-w-2xl">
                  Utilize the Maximo Version Portal to enhance collaboration, track progress, and ensure efficient deployments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

interface ActionCardProps {
    href: string;
    icon: React.ReactNode;
    title: string;
    description: string;
}

function ActionCard({ href, icon, title, description }: ActionCardProps) {
    return (
        <Card className="bg-card shadow-lg rounded-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 border-border/80">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                   {icon}
                </div>
                <div className="flex-1">
                    <CardTitle className="text-xl font-semibold text-foreground">{title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm leading-relaxed">
                {description}
            </p>
            <Button asChild variant="outline" className="w-full sm:w-auto border-primary/50 text-primary hover:bg-primary/5 hover:text-primary">
                <Link href={href}>
                    Go to {title} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
            </CardContent>
        </Card>
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
        <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
             <Skeleton className="h-12 w-12 rounded-full" />
             <div className="flex-1 mt-1">
                <Skeleton className="h-6 w-3/4 mb-1" />
            </div>
        </CardHeader>
        <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-10 w-36" />
        </CardContent>
    </Card>
);

const ChartSkeleton = () => (
    <Card className="shadow-lg rounded-xl">
        <CardHeader>
            <Skeleton className="h-6 w-1/2 mb-1" />
            <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-60 w-full" />
        </CardContent>
    </Card>
);
