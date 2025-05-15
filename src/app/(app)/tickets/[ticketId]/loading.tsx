
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function TicketDetailLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-32 mb-4" /> {/* Back button */}
      
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div className="flex-1">
              <Skeleton className="h-7 w-3/4 mb-1" /> {/* Title */}
              <Skeleton className="h-4 w-1/2" /> {/* ID */}
            </div>
            <div className="flex flex-col sm:items-end gap-2 mt-2 sm:mt-0">
              <Skeleton className="h-7 w-24" /> {/* Status Badge */}
              <Skeleton className="h-5 w-20" /> {/* Priority Badge */}
              <Skeleton className="h-5 w-28" /> {/* Type Badge */}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={`info-skel-${i}`}>
                <Skeleton className="h-4 w-1/3 mb-1" /> {/* Label */}
                <Skeleton className="h-5 w-2/3" /> {/* Value */}
              </div>
            ))}
          </div>
          
          <Separator />
          <Skeleton className="h-6 w-1/4 mb-2" /> {/* Description Title */}
          <Skeleton className="h-16 w-full" /> {/* Description Content */}
          
          <Separator />
          <Skeleton className="h-6 w-1/3 mb-2" /> {/* Associated Commits Title */}
          <Skeleton className="h-40 w-full" /> {/* Commits List Skeleton */}
          
          <Separator />
          <Skeleton className="h-6 w-1/3 mb-2" /> {/* History Title */}
          <Skeleton className="h-20 w-full" /> {/* History List Skeleton */}
          
          <Separator />
          <Skeleton className="h-6 w-1/3 mb-2" /> {/* Comments Title */}
          <Skeleton className="h-24 w-full" /> {/* Comment Form Skeleton */}
        </CardContent>
      </Card>

      {/* CommitChangesForm Skeleton */}
      <Card className="shadow-md rounded-lg">
        <CardHeader>
            <Skeleton className="h-6 w-1/2 mb-1" />
            <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" /> {/* Commit message textarea */}
            <Skeleton className="h-10 w-full" /> {/* Branch select */}
            <Skeleton className="h-10 w-1/3" /> {/* Submit button */}
        </CardContent>
      </Card>
    </div>
  );
}
