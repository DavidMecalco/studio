
"use client"; 

import { MaximoUploaderForm } from '@/components/maximo/maximo-uploader-form';
import { FileManager } from '@/components/files/file-manager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Server, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function MaximoManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const canViewPage = user?.role === 'admin' || user?.role === 'superuser';

  // Show skeleton if auth is loading OR if page content is loading and user has permission
  if (authLoading || (!authLoading && canViewPage && !user)) { // Simpler loading condition, adjust if page has its own data fetching state
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
          <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
        <Separator />
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
          <CardContent><Skeleton className="h-60 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  if (!canViewPage && !authLoading) { // Check after auth completes
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">This page is for admin or superuser users only.</p>
      </div>
    );
  }
  
  // If user is loaded and has permission, render the page content
  if (canViewPage && user) {
      return (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Server className="h-8 w-8 text-primary" /> Maximo Management
              </h1>
              <p className="text-muted-foreground">
                Upload configurations and manage files for Maximo.
              </p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-1"> 
            <MaximoUploaderForm />
            <Separator />
            <FileManager />
          </div>
        </div>
      );
  }
  
  // Fallback, should ideally not be reached if logic above is correct
  return null; 
}
