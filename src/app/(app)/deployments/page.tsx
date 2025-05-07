"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, ListCollapse, PlusCircle, Trash2, Loader2, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getDeploymentLogs, createDeploymentLog, type DeploymentLogEntry, type DeploymentEnvironment, type DeploymentStatus, type CreateDeploymentLogData } from '@/services/deployment';
import { getJiraTickets, type JiraTicket } from '@/services/jira';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'; // ShadCN Form components

const deploymentEnvironments: DeploymentEnvironment[] = ['DEV', 'QA', 'PROD', 'Staging', 'Other'];
const deploymentStatuses: DeploymentStatus[] = ['Success', 'Failure', 'In Progress', 'Pending'];
const fileTypes: Array<DeploymentLogEntry['filesDeployed'][0]['type']> = ['script', 'xml', 'report', 'other'];


const fileSchema = z.object({
  name: z.string().min(1, "File name is required."),
  version: z.string().optional(),
  type: z.enum(fileTypes, { required_error: "File type is required." }),
});

const deploymentFormSchema = z.object({
  filesDeployed: z.array(fileSchema).min(1, "At least one file must be specified for deployment."),
  environment: z.enum(deploymentEnvironments, { required_error: "Environment is required." }),
  status: z.enum(deploymentStatuses, { required_error: "Status is required." }),
  ticketIds: z.array(z.string()).optional(),
  message: z.string().optional(),
});

type DeploymentFormValues = z.infer<typeof deploymentFormSchema>;

export default function DeploymentsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [deploymentLogs, setDeploymentLogs] = useState<DeploymentLogEntry[]>([]);
  const [jiraTickets, setJiraTickets] = useState<JiraTicket[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DeploymentFormValues>({
    resolver: zodResolver(deploymentFormSchema),
    defaultValues: {
      filesDeployed: [{ name: '', type: 'script', version: '' }],
      environment: 'DEV',
      status: 'Success',
      ticketIds: [],
      message: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "filesDeployed",
  });

  useEffect(() => {
    async function fetchData() {
      setIsLoadingLogs(true);
      try {
        const [logs, tickets] = await Promise.all([
          getDeploymentLogs(),
          getJiraTickets() 
        ]);
        setDeploymentLogs(logs);
        setJiraTickets(tickets);
      } catch (error) {
        toast({ title: "Error", description: "Failed to load deployment data.", variant: "destructive" });
      }
      setIsLoadingLogs(false);
    }
    if (!authLoading && user?.role === 'admin') {
        fetchData();
    } else if (!authLoading && user?.role !== 'admin') {
        setIsLoadingLogs(false); // No need to load for non-admins
    }
  }, [toast, authLoading, user]);

  const handleFormSubmit = async (values: DeploymentFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const newLogData: CreateDeploymentLogData = {
        ...values,
        userId: user.id,
      };
      const newLog = await createDeploymentLog(newLogData);
      setDeploymentLogs(prev => [newLog, ...prev]);
      toast({ title: "Success", description: "Deployment log created successfully." });
      form.reset({ 
        filesDeployed: [{ name: '', type: 'script', version: '' }],
        environment: 'DEV',
        status: 'Success',
        ticketIds: [],
        message: '',
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create deployment log.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };
  
  const handleExport = (format: 'pdf' | 'json') => {
    toast({
        title: `Export ${format.toUpperCase()}`,
        description: `Simulating export of deployment logs as ${format.toUpperCase()}. This feature is under development.`,
    });
  }


  if (authLoading || isLoadingLogs && user?.role === 'admin') {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
          <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
          <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
      </div>
    );
  }
  
  if (user?.role !== 'admin') {
     return (
        <div className="space-y-8 text-center py-10">
            <ListCollapse className="h-16 w-16 mx-auto text-destructive" />
            <h1 className="text-2xl font-semibold">Access Denied</h1>
            <p className="text-muted-foreground">This page is for admin/technician users only.</p>
        </div>
     )
  }


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UploadCloud className="h-8 w-8 text-primary" /> Deployment Logs
          </h1>
          <p className="text-muted-foreground">
            Track and manage deployments across environments.
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('pdf')} disabled>
                <Download className="mr-2 h-4 w-4" /> Export PDF (WIP)
            </Button>
            <Button variant="outline" onClick={() => handleExport('json')} disabled>
                <Download className="mr-2 h-4 w-4" /> Export JSON (WIP)
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log New Deployment (Simulated)</CardTitle>
          <CardDescription>Manually log a deployment event. Real deployments would be automated.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-2 block">Files Deployed</Label>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2 mb-3 p-3 border rounded-md">
                    <FormField
                      control={form.control}
                      name={`filesDeployed.${index}.name`}
                      render={({ field: f }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs">File Name</FormLabel>
                          <FormControl><Input placeholder="e.g., script.py" {...f} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`filesDeployed.${index}.version`}
                      render={({ field: f }) => (
                        <FormItem className="w-1/4">
                          <FormLabel className="text-xs">Version (Opt.)</FormLabel>
                           <FormControl><Input placeholder="e.g., 1.0.2" {...f} /></FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`filesDeployed.${index}.type`}
                      render={({ field: f }) => (
                        <FormItem className="w-1/4">
                           <FormLabel className="text-xs">Type</FormLabel>
                          <Select onValueChange={f.onChange} defaultValue={f.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {fileTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', type: 'script', version: '' })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add File
                </Button>
                 {form.formState.errors.filesDeployed && !form.formState.errors.filesDeployed.root && form.formState.errors.filesDeployed.message && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.filesDeployed.message}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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
                          {deploymentStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
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
                        <FormLabel>Associated Jira Tickets (Optional)</FormLabel>
                         <Select onValueChange={(value) => field.onChange(value ? [value] : [])} > {/* Simplified to single select for now */}
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a ticket to associate" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="">-- No Ticket --</SelectItem>
                                {jiraTickets.map(ticket => (
                                    <SelectItem key={ticket.id} value={ticket.id}>{ticket.id} - {ticket.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
                />


              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="Deployment notes or error details..." {...field} /></FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log Deployment
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deployment History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Files</TableHead>
                <TableHead>Tickets</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deploymentLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">{log.id.substring(0,12)}...</TableCell>
                  <TableCell>{format(parseISO(log.timestamp), 'MMM d, yyyy HH:mm')}</TableCell>
                  <TableCell>{log.userId}</TableCell>
                  <TableCell><Badge variant="outline">{log.environment}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'Success' ? 'default' : log.status === 'Failure' ? 'destructive' : 'secondary'}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {log.filesDeployed.map(f => f.name).join(', ')}
                  </TableCell>
                  <TableCell className="text-xs">
                    {log.ticketIds?.join(', ') || '-'}
                  </TableCell>
                  <TableCell className="text-xs max-w-xs truncate">{log.message || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {deploymentLogs.length === 0 && <p className="text-muted-foreground text-center py-4">No deployment logs found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}