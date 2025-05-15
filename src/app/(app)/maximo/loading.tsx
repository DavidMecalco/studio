
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function MaximoManagementLoading() {
  return (
    <div className="space-y-8">
      {/* Page Title Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-7 w-72" /> {/* Title: Maximo Configuration & File Management */}
          </div>
          <Skeleton className="mt-1 h-4 w-4/5" /> {/* Description */}
        </div>
      </div>

      {/* MaximoUploaderForm Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-1" /> {/* Form Title */}
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" /> {/* Name Input */}
          <Skeleton className="h-10 w-full" /> {/* Type Select */}
          <Skeleton className="h-20 w-full" /> {/* Content textarea */}
          <Skeleton className="h-10 w-1/4" /> {/* Submit button */}
        </CardContent>
      </Card>

      <Separator />

      {/* FileManager Skeletons */}
      <div className="space-y-6">
        {/* "Upload New File" Card Skeleton (within FileManager) */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-1" /> {/* Upload New File Title */}
            <Skeleton className="h-4 w-3/4" /> {/* Description */}
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" /> {/* File Input */}
            <Skeleton className="h-10 w-1/3" /> {/* Upload Button */}
          </CardContent>
        </Card>

        {/* "Managed Files" Card Skeleton (within FileManager) */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-1" /> {/* Managed Files Title */}
            <Skeleton className="h-4 w-3/4" /> {/* Description */}
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={`managed-file-skel-${i}`} className="flex justify-between items-center p-2 border-b">
                <div className="flex items-center gap-2 flex-1">
                  <Skeleton className="h-5 w-5" /> {/* File Icon */}
                  <Skeleton className="h-4 w-1/2" /> {/* File Name */}
                </div>
                <Skeleton className="h-4 w-16" /> {/* Size */}
                <Skeleton className="h-4 w-24" /> {/* Last Modified */}
                <div className="flex items-center space-x-1">
                    <Skeleton className="h-8 w-20" /> {/* History Button */}
                    <Skeleton className="h-8 w-24" /> {/* Download Button */}
                    <Skeleton className="h-8 w-8" /> {/* Delete Button */}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

