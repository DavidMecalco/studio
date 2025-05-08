
"use client";

import { useEffect, useState, type ReactNode } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getUsers, createUserInFirestore, type UserDoc, getOrganizations, type Organization } from '@/services/users';
import { useAuth } from '@/context/auth-context';
import { Users as UsersIcon, AlertTriangle, Loader2, Edit, Trash2, PlusCircle } from 'lucide-react';
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

const userFormSchema = z.object({
  id: z.string().optional(), // For editing existing users
  username: z.string().min(3, "Username must be at least 3 characters.").max(50),
  name: z.string().min(1, "Name is required.").max(100),
  role: z.enum(['client', 'admin', 'superuser'], { required_error: "Role is required." }),
  company: z.string().optional(), // Company name as string
  phone: z.string().optional(),
  position: z.string().optional(),
  // No password field here, as it's handled by mock login or external auth
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function UserManagementPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [editingUser, setEditingUser] = useState<UserDoc | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      name: "",
      role: undefined,
      company: "",
      phone: "",
      position: "",
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
        const [fetchedUsers, fetchedOrganizations] = await Promise.all([getUsers(), getOrganizations()]);
        setUsers(fetchedUsers);
        setOrganizations(fetchedOrganizations);
      } catch (error) {
        console.error("Error fetching user management data:", error);
        toast({ title: "Error", description: "Failed to load user data.", variant: "destructive" });
      }
      setIsLoading(false);
    }
    if (canViewPage) {
      fetchData();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [authLoading, canViewPage, toast]);

  const handleCreateOrUpdateUser = async (values: UserFormValues) => {
    setIsSubmitting(true);
    const userDataToSave = {
      id: values.id || values.username, // Use existing id if editing, else username
      username: values.username,
      name: values.name,
      role: values.role,
      company: values.company,
      phone: values.phone,
      position: values.position,
    };

    const success = await createUserInFirestore(userDataToSave);

    if (success) {
      toast({
        title: values.id ? "User Updated" : "User Created",
        description: `User ${values.username} has been successfully ${values.id ? 'updated' : 'created'}.`,
      });
      setUsers(await getUsers()); // Refresh user list
      setIsFormOpen(false);
      setEditingUser(null);
      form.reset();
    } else {
      toast({
        title: "Operation Failed",
        description: `Could not ${values.id ? 'update' : 'create'} user. Username might already exist or server error.`,
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };
  
  const openEditForm = (userToEdit: UserDoc) => {
    setEditingUser(userToEdit);
    form.reset({
      id: userToEdit.id,
      username: userToEdit.username,
      name: userToEdit.name,
      role: userToEdit.role,
      company: userToEdit.company || "",
      phone: userToEdit.phone || "",
      position: userToEdit.position || "",
    });
    setIsFormOpen(true);
  };

  const openCreateForm = () => {
    setEditingUser(null);
    form.reset({
      id: undefined,
      username: "",
      name: "",
      role: undefined,
      company: "",
      phone: "",
      position: "",
    });
    setIsFormOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    // In a real app, this would call a deleteUserFromFirestore function
    // For now, we'll just filter the local state and show a toast.
    // Deleting requires backend logic not implemented here.
    toast({
      title: "Deletion Simulated",
      description: `User ${userId} would be deleted. (Actual deletion not implemented in mock service)`,
      variant: "default",
    });
    // setUsers(users.filter(u => u.id !== userId));
  };


  if (authLoading || (isLoading && canViewPage)) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3" /> <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-12 w-32" />
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
            <UsersIcon className="h-8 w-8 text-primary" /> User Management
          </h1>
          <p className="text-muted-foreground">
            Create, edit, and manage user accounts for the platform.
          </p>
        </div>
        <Button onClick={openCreateForm}><PlusCircle className="mr-2 h-4 w-4" /> Create New User</Button>
      </div>

      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingUser ? 'Edit User' : 'Create New User'}</CardTitle>
            <CardDescription>{editingUser ? `Modify details for ${editingUser.username}` : 'Fill in the details for the new user.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateOrUpdateUser)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., client_newcorp" {...field} disabled={isSubmitting || !!editingUser} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., John Doe" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="admin">Admin (Technician)</SelectItem>
                            <SelectItem value="superuser">Super User</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company / Organization</FormLabel>
                         <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select an organization" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="">-- No Specific Organization --</SelectItem>
                                {organizations.map(org => (
                                    <SelectItem key={org.id} value={org.name}>{org.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Position</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., Project Manager" {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                            <Input type="tel" placeholder="e.g., 555-123-4567" {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setEditingUser(null); form.reset();}} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {editingUser ? 'Update User' : 'Create User'}
                    </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}


      <Card>
        <CardHeader>
          <CardTitle>Existing Users</CardTitle>
          <CardDescription>List of all users currently in the system.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full" /> : users.length === 0 ? <p>No users found.</p> : (
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((userEntry) => (
                        <TableRow key={userEntry.id}>
                            <TableCell className="font-medium">{userEntry.username}</TableCell>
                            <TableCell>{userEntry.name}</TableCell>
                            <TableCell><span className="capitalize">{userEntry.role}</span></TableCell>
                            <TableCell>{userEntry.company || 'N/A'}</TableCell>
                            <TableCell className="space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditForm(userEntry)} title="Edit User">
                                <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={userEntry.username === currentUser?.username} title="Delete User">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This action cannot be undone. This will (simulate) permanently delete the user account for {userEntry.username}.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                    onClick={() => handleDeleteUser(userEntry.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                    Delete User
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
