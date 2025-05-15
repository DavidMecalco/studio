
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function TicketDetailLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-32 mb-6" /> {/* Back button */}
      
      <Card className="shadow-xl rounded-xl border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
            <div className="flex-1">
              <Skeleton className="h-8 w-3/4 mb-2" /> {/* Title */}
              <Skeleton className="h-4 w-1/2" /> {/* ID */}
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
              <Skeleton className="h-7 w-28" /> {/* Status Badge */}
              <Skeleton className="h-5 w-24" /> {/* Priority Badge */}
              <Skeleton className="h-5 w-32" /> {/* Type Badge */}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          <Skeleton className="h-px w-full" /> {/* Separator */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 py-2">
            {[...Array(5)].map((_, i) => (
              <div key={`info-skel-${i}`} className="flex items-start gap-2">
                <Skeleton className="h-5 w-5 rounded-full mt-1" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1.5" /> {/* Label */}
                  <Skeleton className="h-5 w-36" /> {/* Value */}
                </div>
              </div>
            ))}
          </div>
          
          <Skeleton className="h-px w-full" />
          <div>
            <Skeleton className="h-6 w-1/4 mb-2" /> {/* Description Title */}
            <Skeleton className="h-20 w-full rounded-md" /> {/* Description Content */}
          </div>
          
          <Skeleton className="h-px w-full" /> 
           <div className="pt-2 space-y-3"> {/* Admin Actions Skeleton */}
            <Skeleton className="h-6 w-1/3 mb-1" /> {/* Admin Actions Title */}
            <Skeleton className="h-4 w-3/4 mb-3" /> {/* Admin Actions Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={`admin-action-item-skel-${i}`} className="h-10 w-full" />)}
            </div>
            <Skeleton className="h-10 w-1/4" /> {/* Update button */}
          </div>


          <Skeleton className="h-px w-full" />
          <div>
            <Skeleton className="h-6 w-1/3 mb-3" /> {/* Associated Commits Title */}
            <Skeleton className="h-40 w-full rounded-md" /> {/* Commits List Skeleton */}
          </div>
          
          <Skeleton className="h-px w-full" />
          <div>
            <Skeleton className="h-6 w-1/3 mb-3" /> {/* History Title */}
            <Skeleton className="h-32 w-full rounded-md" /> {/* History List Skeleton */}
          </div>
          
          <Skeleton className="h-px w-full" />
          <div>
            <Skeleton className="h-6 w-1/3 mb-3" /> {/* Comments Title */}
            <Skeleton className="h-28 w-full rounded-md" /> {/* Comment Form Skeleton */}
          </div>
        </CardContent>
         <CardFooter className="pt-4 border-t">
            <Skeleton className="h-3 w-24" />
         </CardFooter>
      </Card>

      {/* CommitChangesForm Skeleton */}
      <Card className="shadow-md rounded-lg">
        <CardHeader>
            <Skeleton className="h-6 w-1/2 mb-1" />
            <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" /> {/* Commit message textarea */}
            <Skeleton className="h-10 w-full" /> {/* Branch select */}
            <Skeleton className="h-10 w-1/3" /> {/* Submit button */}
            <Skeleton className="h-px w-full my-3" />
            <Skeleton className="h-6 w-1/2 mb-1" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" /> {/* Restore commit select */}
            <Skeleton className="h-10 w-2/5" /> {/* Restore button */}
        </CardContent>
      </Card>
    </div>
  );
}

