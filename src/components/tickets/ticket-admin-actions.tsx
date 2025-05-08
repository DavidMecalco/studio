
"use client";

import { useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { updateJiraTicketAction } from '@/app/actions/jira-actions';
import type { JiraTicket, JiraTicketStatus, JiraTicketPriority } from '@/services/jira';
import type { UserDoc as ServiceUser } from '@/services/users';
import { Edit, Loader2 } from 'lucide-react';

const ticketStatusOptions: JiraTicketStatus[] = ['Abierto', 'Pendiente', 'En Progreso', 'Resuelto', 'Cerrado', 'En espera del visto bueno', 'Reabierto'];
const ticketPriorityOptions: JiraTicketPriority[] = ['Alta', 'Media', 'Baja'];
const UNASSIGNED_VALUE = "__UNASSIGNED__";

const adminTicketActionSchema = z.object({
  newStatus: z.custom<JiraTicketStatus>((val) => ticketStatusOptions.includes(val as JiraTicketStatus), {
    message: "Invalid status selected.",
  }),
  newPriority: z.custom<JiraTicketPriority>((val) => ticketPriorityOptions.includes(val as JiraTicketPriority), {
    message: "Invalid priority selected.",
  }),
  newAssigneeId: z.string().optional(), // Allows "all", specific ID, or UNASSIGNED_VALUE
  comment: z.string().max(500, "Comment must be 500 characters or less.").optional(),
});

type AdminTicketActionFormValues = z.infer<typeof adminTicketActionSchema>;

interface TicketAdminActionsProps {
  ticket: JiraTicket;
  users: ServiceUser[]; // For assignee dropdown
  onTicketUpdate: () => void; // Callback to refresh parent component
}

export function TicketAdminActions({ ticket, users, onTicketUpdate }: TicketAdminActionsProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const form = useForm<AdminTicketActionFormValues>({
    resolver: zodResolver(adminTicketActionSchema),
    defaultValues: {
      newStatus: ticket.status,
      newPriority: ticket.priority,
      newAssigneeId: ticket.assigneeId || UNASSIGNED_VALUE,
      comment: "",
    },
  });

  useEffect(() => {
    form.reset({
      newStatus: ticket.status,
      newPriority: ticket.priority,
      newAssigneeId: ticket.assigneeId || UNASSIGNED_VALUE,
      comment: "",
    });
  }, [ticket, form]);

  async function onSubmit(values: AdminTicketActionFormValues) {
    if (!currentUser) {
      toast({ title: "Error", description: "Authentication required.", variant: "destructive" });
      return;
    }

    const updates: {
      newStatus?: JiraTicketStatus;
      newAssigneeId?: string;
      newPriority?: JiraTicketPriority;
      comment?: string;
    } = {};

    let changed = false;
    if (values.newStatus !== ticket.status) {
      updates.newStatus = values.newStatus;
      changed = true;
    }
    if (values.newPriority !== ticket.priority) {
      updates.newPriority = values.newPriority;
      changed = true;
    }
    const assigneeToSubmit = values.newAssigneeId === UNASSIGNED_VALUE ? "" : values.newAssigneeId;
    if (assigneeToSubmit !== (ticket.assigneeId || "")) { // Compare with empty string if ticket.assigneeId is undefined
        updates.newAssigneeId = assigneeToSubmit;
        changed = true;
    }
    if (values.comment && values.comment.trim() !== "") {
      updates.comment = values.comment.trim();
      changed = true; // Adding a comment is also an update
    }
    
    if (!changed) {
        toast({ title: "No Changes", description: "No changes detected to update.", variant: "default"});
        return;
    }


    const result = await updateJiraTicketAction(ticket.id, currentUser.id, updates);

    if (result.success && result.ticket) {
      toast({
        title: "Ticket Updated",
        description: `Ticket ${result.ticket.id} has been successfully updated.`,
      });
      onTicketUpdate(); // Refresh parent
    } else {
      toast({
        title: "Update Failed",
        description: result.error || "Could not update the ticket.",
        variant: "destructive",
      });
    }
  }
  
  const technicians = users.filter(u => u.role === 'admin' || u.role === 'superuser');

  return (
    <Card className="shadow-md rounded-lg mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Edit className="h-5 w-5 text-primary" /> Manage Ticket
        </CardTitle>
        <CardDescription>
          Update status, priority, assignee, or add an internal comment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="newStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {ticketStatusOptions.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPriority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {ticketPriorityOptions.map(priority => (
                          <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newAssigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignee</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || UNASSIGNED_VALUE}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED_VALUE}>-- Unassigned --</SelectItem>
                        {technicians.map(tech => (
                          <SelectItem key={tech.id} value={tech.id}>{tech.name} ({tech.username})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Internal Comment (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a comment about this update..."
                      className="min-h-[80px] resize-y"
                      {...field}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update Ticket
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
