
import { TicketList } from '@/components/tickets/ticket-list';
import { CommitList } from '@/components/github/commit-list';
import { MaximoUploaderForm } from '@/components/maximo/maximo-uploader-form';
import { FileManager } from '@/components/files/file-manager';
import { getJiraTickets, type JiraTicket } from '@/services/jira';
import { getGitHubCommits, type GitHubCommit } from '@/services/github';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Activity, Briefcase, Server } from 'lucide-react';

// Simulate data fetching for dashboard
async function getDashboardData() {
  // In a real app, these would be API calls.
  // For now, using the mock data functions from services.
  const jiraTickets: JiraTicket[] = await getJiraTickets();
  
  // For GitHub commits, let's simulate getting commits for a generic "recent activity"
  // or a specific project if applicable. Here, we'll just fetch all available mock commits.
  const gitHubCommits: GitHubCommit[] = await getGitHubCommits("MAX-123"); // Example ticket ID

  return {
    jiraTickets,
    gitHubCommits,
  };
}


export default async function DashboardPage() {
  const { jiraTickets, gitHubCommits } = await getDashboardData();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of recent Maximo versioning activities.
          </p>
        </div>
        {/* Placeholder for potential global actions like "Create New Release" */}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="bg-card shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl gap-2">
                <Activity className="h-6 w-6 text-accent" />
                Recent Jira Tickets
              </CardTitle>
              <CardDescription>Track the latest updates and issues.</CardDescription>
            </CardHeader>
            <CardContent>
              <TicketList tickets={jiraTickets} maxItems={5} title="" />
            </CardContent>
          </Card>

          <Card className="bg-card shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl gap-2">
                <Briefcase className="h-6 w-6 text-accent" />
                Recent GitHub Commits
              </CardTitle>
              <CardDescription>Monitor code changes related to Maximo projects.</CardDescription>
            </CardHeader>
            <CardContent>
              <CommitList commits={gitHubCommits} maxItems={5} title="" />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card className="bg-card shadow-lg rounded-xl">
            <CardHeader>
                <CardTitle className="flex items-center text-xl gap-2">
                    <Server className="h-6 w-6 text-accent" />
                    Maximo Management
                </CardTitle>
                <CardDescription>Upload configurations and manage files.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <MaximoUploaderForm />
                <Separator />
                <FileManager />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

