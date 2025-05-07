
import type { GitHubCommit } from '@/services/github';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GitCommit, GithubIcon, FileText } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface CommitListProps {
  commits: GitHubCommit[];
  title?: string;
  maxItems?: number;
}

export function CommitList({ commits, title = "GitHub Commits", maxItems }: CommitListProps) {
  const displayedCommits = maxItems ? commits.slice(0, maxItems) : commits;

  if (!displayedCommits.length) {
     return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GithubIcon className="h-5 w-5" /> {title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No commits found.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><GithubIcon className="h-5 w-5" /> {title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedCommits.map((commit) => (
            <div key={commit.sha} className="flex items-start gap-3 p-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <GitCommit className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
              <div className="flex-grow">
                <Link href={commit.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                  {commit.message}
                </Link>
                <p className="text-sm text-muted-foreground">
                  SHA: <span className="font-mono text-xs">{commit.sha.substring(0, 7)}</span> by {commit.author}
                </p>
                {commit.filesChanged && commit.filesChanged.length > 0 && (
                  <div className="mt-1">
                    <p className="text-xs text-muted-foreground font-medium">Files changed:</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {commit.filesChanged.map(file => (
                        <Badge key={file} variant="secondary" className="text-xs font-normal flex items-center gap-1">
                          <FileText className="h-3 w-3" /> {file}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
