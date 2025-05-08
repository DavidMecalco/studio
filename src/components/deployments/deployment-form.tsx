
"use client";

import { useState, type ChangeEvent } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { createDeploymentLogAction } from '@/app/actions/deployment-actions';
import type { User as ServiceUser } from '@/services/users';
import type { Ticket as LocalTicket } from '@/services/tickets'; // Updated import
import type { DeploymentEnvironment, DeploymentStatus, DeploymentLogEntry } from '@/services/deployment';
import { UploadCloud, Loader2, FileText, XIcon } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const deploymentEnvironments: DeploymentEnvironment[] = ['DEV', 'QA', 'PROD', 'Staging', 'Other'];
const deploymentStatuses: DeploymentStatus[] = ['Success', 'Failure', 'In Progress', 'Pending'];
const fileTypes: Array<'script' | 'xml' | 'report' | 'other'> = ['script', 'xml', 'report', 'other'];

const MAX_FILE_SIZE_BYTES_SIM = 2 * 1024 * 1024; 

const deploymentFormSchema = z.object({
  environment: z.enum(deploymentEnvironments, { required_error: "Environment is required." }),
  status: z.enum(deploymentStatuses, { required_error: "Status is required." }),
  ticketIds: z.array(z.string()).optional(),
  message: z.string().optional(),
});

type DeploymentFormValues = z.infer<typeof deploymentFormSchema>;

interface FileToDeploy {
  name: string;
  type: 'script' | 'xml' | 'report' | 'other';
  version?: string;
}


interface DeploymentFormProps {
  users: ServiceUser[];
  tickets: LocalTicket[]; // Updated type
  onDeploymentCreated: (newLog: DeploymentLogEntry) => void;
}

const NONE_VALUE_SENTINEL = "__NONE_SENTINEL__";

export function DeploymentForm({ users, tickets, onDeploymentCreated }: DeploymentFormProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filesToDeploy, setFilesToDeploy] = useState<FileToDeploy[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentFileType, setCurrentFileType] = useState<'script' | 'xml' | 'report' | 'other'>('other');
  const [currentFileVersion, setCurrentFileVersion] = useState<string>('');


  const form = useForm<DeploymentFormValues>({
    resolver: zodResolver(deploymentFormSchema),
    defaultValues: {
      environment: undefined,
      status: undefined,
      ticketIds: [],
      message: "",
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        if (file.size > MAX_FILE_SIZE_BYTES_SIM) {
          toast({
            title: "Archivo Demasiado Grande (Simulación)",
            description: `El archivo "${file.name}" excede el límite de 2MB.`,
            variant: "destructive",
          });
          setCurrentFile(null);
          event.target.value = ""; 
          return;
        }
      setCurrentFile(file);
    }
  };

  const addFileToDeployList = () => {
    if (!currentFile) {
        toast({title: "Error", description: "Por favor, seleccione un archivo.", variant: "destructive"});
        return;
    }
    if (filesToDeploy.length >= 10) {
        toast({title: "Límite Alcanzado", description: "Solo puede agregar hasta 10 archivos por despliegue.", variant: "destructive"});
        return;
    }
    setFilesToDeploy(prev => [...prev, { name: currentFile!.name, type: currentFileType, version: currentFileVersion }]);
    setCurrentFile(null);
    setCurrentFileType('other');
    setCurrentFileVersion('');
    const fileInput = document.getElementById('deploymentFile') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };
  
  const removeFileFromDeployList = (fileName: string) => {
    setFilesToDeploy(prev => prev.filter(f => f.name !== fileName));
  };


  async function onSubmit(values: DeploymentFormValues) {
    if (!currentUser) {
      toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
      return;
    }
    if (filesToDeploy.length === 0) {
      toast({ title: "Sin Archivos", description: "Por favor, agregue al menos un archivo desplegado.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const deploymentData = {
      userId: currentUser.id,
      filesDeployed: filesToDeploy,
      environment: values.environment,
      status: values.status,
      ticketIds: values.ticketIds,
      message: values.message,
    };

    const result = await createDeploymentLogAction(deploymentData);

    if (result.success && result.log) {
      toast({
        title: "Deployment Logged Successfully",
        description: `Deployment to ${result.log.environment} recorded with ID ${result.log.id}.`,
      });
      onDeploymentCreated(result.log);
      form.reset();
      setFilesToDeploy([]);
    } else {
      toast({
        title: "Error Logging Deployment",
        description: result.error || "Could not log the deployment.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  }

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <UploadCloud className="h-6 w-6" /> Log New Deployment
        </CardTitle>
        <CardDescription>
          Record the details of a new deployment to an environment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="environment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Environment</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select environment" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {deploymentEnvironments.map(env => <SelectItem key={env} value={env}>{env}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {deploymentStatuses.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ticketIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Associated Ticket (Optional)</FormLabel> {/* Updated label */}
                  <Select
                    onValueChange={(selectedValue) => {
                      if (selectedValue === NONE_VALUE_SENTINEL) {
                        field.onChange([]);
                      } else if (selectedValue) {
                        field.onChange([selectedValue]);
                      } else {
                        field.onChange([]); 
                      }
                    }}
                    value={
                      field.value && field.value.length > 0
                        ? field.value[0] 
                        : NONE_VALUE_SENTINEL 
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a ticket or None" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE_SENTINEL}>None</SelectItem>
                      {tickets.map(ticket => (
                        <SelectItem key={ticket.id} value={ticket.id}>
                          {ticket.id} - {ticket.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4 p-4 border rounded-md">
                <h4 className="text-md font-medium">Files Deployed (Simulated Upload)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <Label htmlFor="deploymentFile">File</Label>
                        <Input id="deploymentFile" type="file" onChange={handleFileChange} />
                    </div>
                    <div>
                        <Label htmlFor="fileType">File Type</Label>
                        <Select value={currentFileType} onValueChange={(v) => setCurrentFileType(v as any)}>
                            <SelectTrigger id="fileType"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {fileTypes.map(ft => <SelectItem key={ft} value={ft}>{ft.toUpperCase()}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="fileVersion">Version (Optional)</Label>
                        <Input id="fileVersion" placeholder="e.g., 1.2.3" value={currentFileVersion} onChange={(e) => setCurrentFileVersion(e.target.value)} />
                    </div>
                </div>
                <Button type="button" variant="outline" onClick={addFileToDeployList} disabled={!currentFile || filesToDeploy.length >= 10}>
                    Add File to List
                </Button>

                {filesToDeploy.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium">Files to be logged in deployment:</p>
                        <ul className="list-none space-y-1">
                        {filesToDeploy.map((file, idx) => (
                            <li key={`${file.name}-${idx}`} className="flex justify-between items-center text-sm p-2 border rounded-md bg-muted/50">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground"/>
                                    <span>{file.name} ({file.type}{file.version ? `, v${file.version}` : ''})</span>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeFileFromDeployList(file.name)} className="text-destructive hover:bg-destructive/10 h-6 w-6">
                                    <XIcon className="h-4 w-4" />
                                </Button>
                            </li>
                        ))}
                        </ul>
                    </div>
                )}
            </div>


            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message/Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional notes or error details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting || filesToDeploy.length === 0}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Log Deployment
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

