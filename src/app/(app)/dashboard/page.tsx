import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Ticket, Github, Server, CheckCircle2, ClipboardList, GitMerge, Briefcase } from 'lucide-react';
import Image from 'next/image';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { TicketManagementCard } from '@/components/dashboard/ticket-management-card';
import { getJiraTickets, type JiraTicket } from '@/services/jira';
import { getGitHubCommits, type GitHubCommit } from '@/services/github';
import { getUsers, type User } from '@/services/users';
import { subWeeks, isAfter } from 'date-fns';

async function getDashboardData() {
  const [jiraTickets, githubCommits, users] = await Promise.all([
    getJiraTickets(),
    getGitHubCommits("ALL_PROJECTS"), // Fetch all commits for dashboard KPIs
    getUsers(),
  ]);
  return { jiraTickets, githubCommits, users };
}

export default async function DashboardOverviewPage() {
  const { jiraTickets, githubCommits, users } = await getDashboardData();

  // Calculate KPIs
  const closedTicketsCount = jiraTickets.filter(
    ticket => ticket.status === 'Cerrado' || ticket.status === 'Resuelto'
  ).length;

  const pendingTicketsCount = jiraTickets.filter(
    ticket => ['Abierto', 'Pendiente', 'En Progreso', 'En espera del visto bueno'].includes(ticket.status)
  ).length;

  const oneWeekAgo = subWeeks(new Date(), 1);
  const commitsLastWeekCount = githubCommits.filter(
    commit => isAfter(new Date(commit.date), oneWeekAgo)
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Bienvenido al Portal Maximo</h1>
          <p className="text-muted-foreground">
            Su centro de operaciones para la gestión de versiones de Maximo.
          </p>
        </div>
      </div>

      {/* KPIs Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Tickets Cerrados"
          value={closedTicketsCount}
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          description="Total de tickets completados."
          className="shadow-lg rounded-xl"
        />
        <KpiCard
          title="Tickets Pendientes"
          value={pendingTicketsCount}
          icon={<ClipboardList className="h-5 w-5 text-yellow-500" />}
          description="Tickets activos o esperando acción."
          className="shadow-lg rounded-xl"
        />
        <KpiCard
          title="Commits (Última Semana)"
          value={commitsLastWeekCount}
          icon={<GitMerge className="h-5 w-5 text-blue-500" />}
          description="Actividad reciente en repositorios."
          className="shadow-lg rounded-xl"
        />
      </div>

      {/* Navigation Cards Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
      </div>

      {/* Ticket Management Section */}
      <TicketManagementCard tickets={jiraTickets} users={users} defaultIcon={<Briefcase className="h-6 w-6 text-primary" />} />

      {/* Image Card Section - can be kept or removed based on preference */}
      <Card className="bg-card shadow-lg rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="relative h-64 w-full">
            <Image
              src="https://picsum.photos/1200/400"
              alt="Abstract technology background"
              layout="fill"
              objectFit="cover"
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