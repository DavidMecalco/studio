
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyTicketsLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-44" /> {/* Create Ticket Button Skeleton */}
      </div>

      {/* Filters Skeleton Card */}
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
            {[...Array(5)].map((_, i) => <Skeleton key={`filter-item-skel-${i}`} className="h-10 w-full" />)}
          </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
             <div className="md:col-span-2 lg:col-span-3 xl:col-span-2">
                <Skeleton className="h-10 w-full" /> {/* Search input */}
             </div>
             <div className="self-end xl:col-start-1">
                <Skeleton className="h-10 w-36" /> {/* Reset button */}
             </div>
           </div>
        </CardContent>
      </Card>

      {/* TicketList Skeleton Card */}
      <Card className="shadow-xl rounded-xl">
        <CardHeader>
          <Skeleton className="h-6 w-1/2 mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={`list-item-skel-${i}`} className="flex justify-between items-center p-3 border-b">
              <div className="space-y-1.5 flex-grow">
                <Skeleton className="h-4 w-1/5" /> {/* ID */}
                <Skeleton className="h-4 w-3/5" /> {/* Title */}
                <div className="flex gap-2">
                    <Skeleton className="h-3 w-1/4" /> {/* Type */}
                    <Skeleton className="h-3 w-1/4" /> {/* Status */}
                    <Skeleton className="h-3 w-1/4" /> {/* Priority */}
                </div>
              </div>
              <Skeleton className="h-9 w-24" /> {/* Action Button */}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
