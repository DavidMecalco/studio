
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
import type { User as AuthUser } from '@/context/auth-context'; // Renamed to avoid conflict with service User
import type { UserDoc as ServiceUser } from '@/services/users'; // Keep this for the list of assignable users
import { updateJiraTicketAction } from '@/app/actions/jira-actions';
import { Briefcase, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';


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
  users: ServiceUser[]; // List of users that can be assigned
  defaultIcon?: ReactNode;
}

export function TicketManagementCard({ tickets: initialTickets, users, defaultIcon = <Briefcase className="h-6 w-6" /> }: TicketManagementCardProps) {
  const [tickets, setTickets] = useState<JiraTicket[]>(initialTickets);
  const { toast } = useToast();
  const router = useRouter();
  const { user: currentUser } = useAuth(); // Get the currently logged-in user

  const form = useForm<TicketManagementFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ticketId: "",
      assigneeId: UNASSIGNED_VALUE, 
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
          assigneeId: ticket.assigneeId || UNASSIGNED_VALUE, 
          newStatus: ticket.status,
        });
      }
    } else {
       form.reset({ 
          ticketId: "",
          assigneeId: UNASSIGNED_VALUE, 
          newStatus: undefined,
       });
    }
  }, [selectedTicketId, tickets, form]);
  
  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);


  async function onSubmit(values: TicketManagementFormValues) {
    if (!currentUser) {
        toast({ title: "Error", description: "Current user not found. Please re-login.", variant: "destructive" });
        return;
    }
    // Superuser and Admin can manage tickets
    if (currentUser.role !== 'admin' && currentUser.role !== 'superuser') {
        toast({ title: "Error", description: "You do not have permission to manage tickets.", variant: "destructive" });
        return;
    }

    const actualAssigneeId = values.assigneeId === UNASSIGNED_VALUE ? "" : values.assigneeId;
    
    const result = await updateJiraTicketAction(
      values.ticketId,
      currentUser.id, // Pass the ID of the user performing the action
      {
        newStatus: values.newStatus,
        newAssigneeId: actualAssigneeId
      }
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
          assigneeId: result.ticket.assigneeId || UNASSIGNED_VALUE, 
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
  
  // Ensure only Admin or Superuser can interact with this card
  if (currentUser?.role !== 'admin' && currentUser?.role !== 'superuser') {
    return null; // Or a message indicating restricted access
  }


  return (
    <Card className="shadow-lg rounded-xl">
      <CardContent>
        {/* Content removed as per user request */}
      </CardContent>
    </Card>
  );
}


