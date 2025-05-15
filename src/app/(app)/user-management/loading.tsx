
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserManagementLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Skeleton className="h-8 w-56 mb-1" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-44" /> {/* Create User Button Skeleton */}
      </div>

      {/* Form Skeleton (if form might be open) - Optional, could be simpler */}
      {/* For now, we'll skip form skeleton as it's conditional */}

      {/* User List Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 items-center p-2 border-b">
              <Skeleton className="h-4 w-full" /> {/* Username */}
              <Skeleton className="h-4 w-full" /> {/* Name */}
              <Skeleton className="h-4 w-full" /> {/* Email */}
              <Skeleton className="h-4 w-full" /> {/* Role */}
              <Skeleton className="h-4 w-full" /> {/* Company */}
              <Skeleton className="h-8 w-20" /> {/* Actions */}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
