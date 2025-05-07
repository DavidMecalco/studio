
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Ticket, Github, Server } from 'lucide-react';
import Image from 'next/image';


export default async function DashboardOverviewPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome to Maximo Portal</h1>
          <p className="text-muted-foreground">
            Your central hub for managing Maximo versioning activities.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card shadow-lg rounded-xl hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-xl gap-2">
              <Ticket className="h-6 w-6 text-accent" />
              Jira Tickets
            </CardTitle>
            <CardDescription>Track issues and project progress.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View, manage, and monitor Jira tickets related to Maximo projects.
            </p>
            <Button asChild>
              <Link href="/jira">
                Go to Jira Tickets <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-lg rounded-xl hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-xl gap-2">
              <Github className="h-6 w-6 text-accent" />
              GitHub Commits
            </CardTitle>
            <CardDescription>Monitor code changes and repository activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Review recent commits and track development progress in associated GitHub repositories.
            </p>
            <Button asChild>
              <Link href="/github">
                View GitHub Commits <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-lg rounded-xl hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-xl gap-2">
              <Server className="h-6 w-6 text-accent" />
              Maximo Management
            </CardTitle>
            <CardDescription>Upload configurations and manage files.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Access tools for uploading Maximo configurations and managing related files.
            </p>
            <Button asChild>
              <Link href="/maximo">
                Manage Maximo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

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
                Stay Ahead with Maximo Version Portal
              </h2>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
