
"use client"; // Make this a client component for auth check

import { useEffect, useState } from 'react';
import { CommitList } from '@/components/github/commit-list';
import { getGitHubCommits, type GitHubCommit } from '@/services/github';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Github as GithubIcon, AlertTriangle } from 'lucide-react'; 
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';


export default function GitHubPage() {
  const { user, loading: authLoading } = useAuth();
  const [gitHubCommits, setGitHubCommits] = useState<GitHubCommit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const canViewPage = user?.role === 'admin' || user?.role === 'superuser';

  useEffect(() => {
    async function fetchData() {
      if (authLoading || !canViewPage) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const commits = await getGitHubCommits("ALL_PROJECTS");
        setGitHubCommits(commits);
      } catch (error) {
        console.error("Error fetching GitHub commits:", error);
        // Optionally, show a toast or error message
      }
      setIsLoading(false);
    }
     if (canViewPage) {
      fetchData();
    } else if (!authLoading) {
        setIsLoading(false);
    }
  }, [user, authLoading, canViewPage]);

  if (authLoading || (isLoading && canViewPage)) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canViewPage) {
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
            <GithubIcon className="h-8 w-8 text-primary" /> GitHub Commits
          </h1>
          <p className="text-muted-foreground">
            Monitor code changes related to Maximo projects.
          </p>
        </div>
      </div>

      <Card className="bg-card shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle>All Recent Commits</CardTitle>
          <CardDescription>Review recent code changes across projects.</CardDescription>
        </CardHeader>
        <CardContent>
          <CommitList commits={gitHubCommits} title="" />
        </CardContent>
      </Card>
    </div>
  );
}

