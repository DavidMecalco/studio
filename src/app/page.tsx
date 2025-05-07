'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  // Show a loading state while redirecting
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="space-y-4 p-8 text-center">
        <Skeleton className="mx-auto h-12 w-12 rounded-full" />
        <Skeleton className="mx-auto h-4 w-[250px]" />
        <Skeleton className="mx-auto h-4 w-[200px]" />
        <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
