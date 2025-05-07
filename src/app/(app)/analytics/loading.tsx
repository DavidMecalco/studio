
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart as AnalyticsIcon, Ticket } from 'lucide-react';

const KpiCardSkeleton = () => (
    <Card className="shadow-sm rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-5" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-6 w-12 mb-1" />
            <Skeleton className="h-3 w-32" />
        </CardContent>
    </Card>
);

const ChartSkeleton = ({titlePlaceholder}: {titlePlaceholder: string}) => (
    <Card>
        <CardHeader>
            <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
            <CardDescription><Skeleton className="h-4 w-3/4" /></CardDescription>
        </CardHeader>
        <CardContent>
            <Skeleton className="h-60 w-full" />
        </CardContent>
    </Card>
);


export default function AnalyticsLoading() {
  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <AnalyticsIcon className="h-8 w-8 text-primary" /> Metrics & Analytics
                </h1>
                <p className="text-muted-foreground">
                    Loading analytics data...
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
            </div>
        </div>

        <Card>
            <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                     {[...Array(5)].map((_, i) => <Skeleton key={`filter-skel-load-${i}`} className="h-10 w-full" />)}
                </div>
                <Skeleton className="h-10 w-32" />
            </CardContent>
        </Card>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[...Array(5)].map((_, i) => <KpiCardSkeleton key={`kpi-skel-load-${i}`} />)}
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <ChartSkeleton titlePlaceholder="Tickets by Status" />
            <ChartSkeleton titlePlaceholder="Commits Over Time" />
        </div>
         <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <ChartSkeleton titlePlaceholder="Technician Activity" />
            <ChartSkeleton titlePlaceholder="Deployments by Environment" />
        </div>
         <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <ChartSkeleton titlePlaceholder="Tickets by Priority" />
            <ChartSkeleton titlePlaceholder="Component Frequency" />
        </div>
         <Card>
            <CardHeader>
                <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
                <CardDescription><Skeleton className="h-4 w-3/4" /></CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </CardContent>
        </Card>
    </div>
  );
}
