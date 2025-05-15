
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function TicketsLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>

      {/* Filters Skeleton Card */}
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 items-end">
            {[...Array(7)].map((_, i) => <Skeleton key={`filter-item-skel-${i}`} className="h-10 w-full" />)}
          </div>
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-full">
            <Skeleton className="h-10 w-full mt-4" /> {/* Search input */}
          </div>
          <Skeleton className="h-10 w-36 mt-4" /> {/* Reset button */}
        </CardContent>
      </Card>

      {/* TicketList Skeleton Card */}
      <Card className="shadow-xl rounded-xl">
        <CardHeader>
          <Skeleton className="h-6 w-1/2 mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
             <div key={`list-item-skel-${i}`} className="flex justify-between items-center p-3 border-b">
              <div className="space-y-1.5 flex-grow">
                <Skeleton className="h-4 w-1/6" /> {/* ID */}
                <Skeleton className="h-4 w-4/6" /> {/* Title */}
                <div className="flex gap-2">
                    <Skeleton className="h-3 w-1/5" /> {/* Type */}
                    <Skeleton className="h-3 w-1/5" /> {/* Status */}
                    <Skeleton className="h-3 w-1/5" /> {/* Priority */}
                    <Skeleton className="h-3 w-1/5" /> {/* Requesting User */}
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
