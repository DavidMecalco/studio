
import { MaximoUploaderForm } from '@/components/maximo/maximo-uploader-form';
import { FileManager } from '@/components/files/file-manager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Server } from 'lucide-react';

export default async function MaximoManagementPage() {
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

      <div className="grid gap-8 lg:grid-cols-1"> {/* Changed to single column for better focus */}
        <MaximoUploaderForm />
        <Separator />
        <FileManager />
      </div>
    </div>
  );
}
