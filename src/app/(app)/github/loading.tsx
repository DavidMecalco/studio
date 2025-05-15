
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function GitHubLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-7 w-48" />
      </div>
      <Skeleton className="h-4 w-3/4" />

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
              <Skeleton className="h-5 w-5 mt-1" />
              <div className="flex-grow space-y-2">
                <Skeleton className="h-4 w-3/4" /> {/* Commit message */}
                <Skeleton className="h-3 w-1/2" /> {/* SHA and author */}
                <Skeleton className="h-3 w-1/4" /> {/* Files changed title */}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
