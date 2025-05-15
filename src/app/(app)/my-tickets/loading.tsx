
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyTicketsLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-1" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-40" /> {/* Create Ticket Button Skeleton */}
      </div>

      {/* Filters Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => <Skeleton key={`filter-skel-${i}`} className="h-10 w-full" />)}
          </div>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>

      {/* TicketList Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={`list-item-skel-${i}`} className="flex justify-between items-center p-3 border-b">
              <div className="space-y-1 flex-grow">
                <Skeleton className="h-4 w-1/4" /> {/* ID */}
                <Skeleton className="h-4 w-1/2" /> {/* Title */}
                <Skeleton className="h-3 w-1/3" /> {/* Status */}
              </div>
              <Skeleton className="h-8 w-24" /> {/* Action Button */}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
