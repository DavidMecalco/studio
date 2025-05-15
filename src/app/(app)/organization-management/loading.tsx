
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrganizationManagementLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Skeleton className="h-8 w-72 mb-1" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-52" /> {/* Create Org Button Skeleton */}
      </div>

      {/* Organization List Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-4 items-center p-2 border-b">
              <Skeleton className="h-4 w-full" /> {/* ID */}
              <Skeleton className="h-4 w-full" /> {/* Name */}
              <Skeleton className="h-4 w-full" /> {/* GitHub Repo */}
              <Skeleton className="h-8 w-20" /> {/* Actions */}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
