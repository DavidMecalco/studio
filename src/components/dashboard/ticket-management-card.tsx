
"use client";

import { useState, useEffect, type ReactNode } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { JiraTicket, JiraTicketStatus } from '@/services/jira';
import type { User } from '@/services/users';
import { updateJiraTicketAction } from '@/app/actions/jira-actions';
import { Briefcase, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

const ticketStatusOptions: { value: JiraTicketStatus; label: string }[] = [
  { value: 'Abierto', label: 'Abierto' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'En Progreso', label: 'En Progreso' },
  { value: 'En espera del visto bueno', label: 'En espera del visto bueno' },
  { value: 'Resuelto', label: 'Resuelto' },
  { value: 'Cerrado', label: 'Cerrado' },
];

const UNASSIGNED_VALUE = "__UNASSIGNED__"; // Sentinel value for unassigned

const formSchema = z.object({
  ticketId: z.string().min(1, "Seleccione un ticket."),
  assigneeId: z.string().optional(), 
  newStatus: z.custom<JiraTicketStatus>(
    (val) => ticketStatusOptions.some(opt => opt.value === val), 
    "Seleccione un estado válido."
  ),
});

type TicketManagementFormValues = z.infer<typeof formSchema>;

interface TicketManagementCardProps {
  tickets: JiraTicket[];
  users: User[];
  defaultIcon?: ReactNode;
}

export function TicketManagementCard({ tickets: initialTickets, users, defaultIcon = <Briefcase className="h-6 w-6" /> }: TicketManagementCardProps) {
  const [tickets, setTickets] = useState<JiraTicket[]>(initialTickets);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<TicketManagementFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ticketId: "",
      assigneeId: UNASSIGNED_VALUE, // Use sentinel value
      newStatus: undefined,
    },
  });

  const selectedTicketId = form.watch("ticketId");

  useEffect(() => {
    if (selectedTicketId) {
      const ticket = tickets.find(t => t.id === selectedTicketId);
      if (ticket) {
        form.reset({
          ticketId: ticket.id,
          assigneeId: ticket.assigneeId || UNASSIGNED_VALUE, // Use sentinel value
          newStatus: ticket.status,
        });
      }
    } else {
       form.reset({ 
          ticketId: "",
          assigneeId: UNASSIGNED_VALUE, // Use sentinel value
          newStatus: undefined,
       });
    }
  }, [selectedTicketId, tickets, form]);
  
  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);


  async function onSubmit(values: TicketManagementFormValues) {
    const actualAssigneeId = values.assigneeId === UNASSIGNED_VALUE ? "" : values.assigneeId;
    
    const result = await updateJiraTicketAction(
      values.ticketId,
      values.newStatus,
      actualAssigneeId 
    );

    if (result.success && result.ticket) {
      toast({
        title: "Ticket Actualizado",
        description: `El ticket ${result.ticket.id} ha sido actualizado a "${result.ticket.status}".`,
      });
      // Update local tickets state
      setTickets(prevTickets => prevTickets.map(t => t.id === result.ticket!.id ? result.ticket! : t));
      form.reset({ 
          ticketId: values.ticketId,
          assigneeId: result.ticket.assigneeId || UNASSIGNED_VALUE, // Use sentinel value
          newStatus: result.ticket.status,
      });
      router.refresh(); 
    } else {
      toast({
        title: "Error al Actualizar",
        description: result.error || "No se pudo actualizar el ticket.",
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
            {defaultIcon} Gestionar Tickets
        </CardTitle>
        <CardDescription>Asignar tickets, y cambiar su estado.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="ticketId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seleccionar Ticket</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Elija un ticket..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tickets.map(ticket => (
                        <SelectItem key={ticket.id} value={ticket.id}>
                          {ticket.id} - {ticket.title} ({ticket.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedTicketId && (
              <>
                <FormField
                  control={form.control}
                  name="assigneeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asignar Usuario (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un usuario o deje vacío..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={UNASSIGNED_VALUE}>-- Sin Asignar --</SelectItem>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nuevo Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un nuevo estado..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ticketStatusOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting || !selectedTicketId}>
                  {form.formState.isSubmitting ? "Actualizando..." : "Actualizar Ticket"}
                   <RotateCcw className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
