
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function MaximoManagementLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-7 w-48" />
      </div>
      <Skeleton className="h-4 w-3/4" />

      {/* MaximoUploaderForm Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" /> {/* Content textarea */}
          <Skeleton className="h-10 w-1/4" /> {/* Submit button */}
        </CardContent>
      </Card>

      <Separator />

      {/* FileManager Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center p-2 border-b">
              <div className="flex items-center gap-2 flex-1">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-32" /> {/* Action buttons */}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
