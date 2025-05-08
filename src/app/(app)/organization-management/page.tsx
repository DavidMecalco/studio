
"use client";

import { useEffect, useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getOrganizations, createOrUpdateOrganization as createOrUpdateOrgService, type Organization } from '@/services/users';
import { createOrUpdateOrganizationAction } from '@/app/actions/user-actions';
import { useAuth } from '@/context/auth-context';
import { Building, AlertTriangle, Loader2, Edit, Trash2, PlusCircle, Github } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const organizationFormSchema = z.object({
  id: z.string().min(1, "Organization ID (slug) is required.").max(50)
    .regex(/^[a-z0-9-]+$/, "ID can only contain lowercase letters, numbers, and hyphens."),
  name: z.string().min(1, "Organization name is required.").max(100),
  githubRepository: z.string().optional()
    .refine(val => !val || /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(val), {
      message: "Must be in format 'owner/repo_name' or empty.",
    }),
});

type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

export default function OrganizationManagementPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      id: "",
      name: "",
      githubRepository: "",
    },
  });

  const canViewPage = currentUser?.role === 'superuser';

  useEffect(() => {
    async function fetchData() {
      if (authLoading || !canViewPage) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const fetchedOrganizations = await getOrganizations();
        setOrganizations(fetchedOrganizations);
      } catch (error) {
        console.error("Error fetching organization data:", error);
        toast({ title: "Error", description: "Failed to load organization data.", variant: "destructive" });
      }
      setIsLoading(false);
    }
    if (canViewPage) {
      fetchData();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [authLoading, canViewPage, toast]);

  const handleCreateOrUpdateOrg = async (values: OrganizationFormValues) => {
    setIsSubmitting(true);
    const orgData: Organization = {
      id: values.id,
      name: values.name,
      githubRepository: values.githubRepository || undefined, // Store as undefined if empty
    };

    const result = await createOrUpdateOrganizationAction(orgData);

    if (result.success) {
      toast({
        title: editingOrg ? "Organization Updated" : "Organization Created",
        description: `Organization ${values.name} has been successfully ${editingOrg ? 'updated' : 'created'}.`,
      });
      setOrganizations(await getOrganizations()); // Refresh organization list
      setIsFormOpen(false);
      setEditingOrg(null);
      form.reset();
    } else {
      toast({
        title: "Operation Failed",
        description: result.error || `Could not ${editingOrg ? 'update' : 'create'} organization.`,
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };
  
  const openEditForm = (orgToEdit: Organization) => {
    setEditingOrg(orgToEdit);
    form.reset({
      id: orgToEdit.id,
      name: orgToEdit.name,
      githubRepository: orgToEdit.githubRepository || "",
    });
    setIsFormOpen(true);
  };

  const openCreateForm = () => {
    setEditingOrg(null);
    form.reset({
      id: "",
      name: "",
      githubRepository: "",
    });
    setIsFormOpen(true);
  };

  const handleDeleteOrg = async (orgId: string) => {
    // Actual deletion would require a backend service
    toast({
      title: "Deletion Simulated",
      description: `Organization ${orgId} would be deleted. (Actual deletion not implemented in mock service)`,
    });
    // setOrganizations(organizations.filter(o => o.id !== orgId));
  };

  if (authLoading || (isLoading && canViewPage)) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3" /> <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-12 w-40" />
        <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><Skeleton className="h-60 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!canViewPage) {
    return (
      <div className="space-y-8 text-center py-10">
        <AlertTriangle className="h-16 w-16 mx-auto text-destructive" />
        <h1 className="text-2xl font-semibold">Access Denied</h1>
        <p className="text-muted-foreground">This page is for superuser users only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building className="h-8 w-8 text-primary" /> Organization Management
          </h1>
          <p className="text-muted-foreground">
            Create, edit, and manage organizations and their linked GitHub repositories.
          </p>
        </div>
        <Button onClick={openCreateForm}><PlusCircle className="mr-2 h-4 w-4" /> Create New Organization</Button>
      </div>

      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingOrg ? 'Edit Organization' : 'Create New Organization'}</CardTitle>
            <CardDescription>{editingOrg ? `Modify details for ${editingOrg.name}` : 'Fill in the details for the new organization.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateOrUpdateOrg)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization ID (Slug)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., new-corp-global" {...field} disabled={isSubmitting || !!editingOrg} />
                      </FormControl>
                      <FormMessage />
                       <p className="text-xs text-muted-foreground pt-1">Unique identifier, e.g., 'tla', 'fema-services'. Used internally.</p>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., New Corp Global Inc." {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="githubRepository"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GitHub Repository (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                            <Github className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="owner/repository-name" {...field} className="pl-10" disabled={isSubmitting} />
                        </div>
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground pt-1">Example: 'my-org/maximo-customizations'. Leave empty if not applicable.</p>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setEditingOrg(null); form.reset();}} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {editingOrg ? 'Update Organization' : 'Create Organization'}
                    </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Existing Organizations</CardTitle>
          <CardDescription>List of all organizations registered in the system.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full" /> : organizations.length === 0 ? <p>No organizations found.</p> : (
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>ID (Slug)</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>GitHub Repository</TableHead>
                        <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {organizations.map((org) => (
                        <TableRow key={org.id}>
                            <TableCell className="font-mono text-xs">{org.id}</TableCell>
                            <TableCell className="font-medium">{org.name}</TableCell>
                            <TableCell>
                                {org.githubRepository ? (
                                    <a href={`https://github.com/${org.githubRepository}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm">
                                       <Github className="h-4 w-4" /> {org.githubRepository}
                                    </a>
                                ) : 'N/A'}
                            </TableCell>
                            <TableCell className="space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditForm(org)} title="Edit Organization">
                                <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                {/* Prevent deletion of core orgs like 'tla', 'fema' for demo stability */}
                                <Button variant="ghost" size="icon" disabled={['tla', 'fema', 'system-corp', 'maximo-corp'].includes(org.id)} title="Delete Organization">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This action cannot be undone. This will (simulate) permanently delete the organization: {org.name}.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                    onClick={() => handleDeleteOrg(org.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                    Delete Organization
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
