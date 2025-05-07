
"use client";

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getFileVersions, type FileVersion } from '@/services/github'; // Using GitHub service for mock versions
import { restoreFileVersionAction } from '@/app/actions/file-actions';
import { useAuth } from '@/context/auth-context';
import { History, GitCommit, User, CalendarDays, RefreshCcw, Loader2, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '../ui/separator';

interface FileVersionHistoryDialogProps {
  fileName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId?: string; // Optional: if restoration is tied to a ticket
}

export function FileVersionHistoryDialog({
  fileName,
  isOpen,
  onOpenChange,
  ticketId,
}: FileVersionHistoryDialogProps) {
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null); // Stores ID of version being restored
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && fileName) {
      setIsLoading(true);
      getFileVersions(fileName)
        .then(setVersions)
        .catch(err => {
          console.error("Failed to fetch file versions:", err);
          toast({ title: "Error", description: "Could not load file versions.", variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, fileName, toast]);

  const handleRestore = async (version: FileVersion) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to restore files.", variant: "destructive" });
      return;
    }
    setIsRestoring(version.id);
    const result = await restoreFileVersionAction(
      user.username,
      fileName,
      version.id,
      version.commitSha,
      ticketId
    );

    if (result.success) {
      toast({
        title: "File Restored (Simulated)",
        description: `${fileName} has been restored to version ${version.id}.`,
      });
      onOpenChange(false); // Close dialog on success
    } else {
      toast({
        title: "Restoration Failed",
        description: result.error || "Could not restore file.",
        variant: "destructive",
      });
    }
    setIsRestoring(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Version History: {fileName}
          </DialogTitle>
          <DialogDescription>
            Review and restore previous versions of this file. Restoring creates a new commit with the selected version's content.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading && (
            <div className="space-y-3 py-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-3 border rounded-md space-y-2 animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                        <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
                ))}
            </div>
          )}
          {!isLoading && versions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No version history found for this file.</p>
            </div>
          )}
          {!isLoading && versions.length > 0 && (
            <ul className="space-y-3 py-2">
              {versions.map((version, index) => (
                <li key={version.id} className="p-4 border rounded-lg shadow-sm bg-card">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <Badge variant="outline" className="text-xs">Version ID: {version.id}</Badge>
                      {index === 0 && <Badge variant="secondary" className="ml-2 text-xs">Current/Latest</Badge>}
                    </div>
                     <Button
                        variant={index === 0 ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleRestore(version)}
                        disabled={isRestoring === version.id || index === 0}
                        className="w-full sm:w-auto"
                      >
                        {isRestoring === version.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCcw className="mr-2 h-4 w-4" />
                        )}
                        {index === 0 ? "Es Actual" : (isRestoring === version.id ? "Restaurando..." : "Restaurar esta Versión")}
                      </Button>
                  </div>
                  <Separator className="my-3"/>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {version.message && <p className="font-medium text-card-foreground">{version.message}</p>}
                    <p className="flex items-center gap-1"><GitCommit className="h-4 w-4" /> Commit: <span className="font-mono text-xs">{version.commitSha}</span></p>
                    <p className="flex items-center gap-1"><User className="h-4 w-4" /> Author: {version.author}</p>
                    <p className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Date: {format(parseISO(version.timestamp), "PPP p")}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
