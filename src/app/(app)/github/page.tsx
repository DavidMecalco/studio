
import { CommitList } from '@/components/github/commit-list';
import { getGitHubCommits, type GitHubCommit } from '@/services/github';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Github as GithubIcon } from 'lucide-react'; 

async function getPageData() {
  // For a dedicated GitHub page, you might fetch all relevant commits or commits from specific repos.
  // Here, we'll simulate fetching commits broadly.
  const gitHubCommits: GitHubCommit[] = await getGitHubCommits("ALL_PROJECTS"); // Example: fetch for all
  return { gitHubCommits };
}

export default async function GitHubPage() {
  const { gitHubCommits } = await getPageData();

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
