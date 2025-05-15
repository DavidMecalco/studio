
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileLoading() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-7 w-32" />
      </div>
      <Skeleton className="h-4 w-1/2 mb-6" />

      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-1" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32 mb-1" /> {/* Label */}
              <Skeleton className="h-5 w-3/4" /> {/* Value */}
              {i < 4 && <Skeleton className="h-px w-full mt-3" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
