
"use server";

import type { JiraTicket, JiraTicketStatus, JiraTicketProvider, JiraTicketBranch, CreateJiraTicketData, JiraTicketPriority } from "@/services/jira";
import { updateJiraTicket, createJiraTicket as createJiraTicketService } from "@/services/jira";
import { revalidatePath } from "next/cache";

interface UpdateJiraTicketResult {
  success: boolean;
  ticket?: JiraTicket;
  error?: string;
}

/**
 * Server action to update a Jira ticket's status and assignee.
 * @param ticketId The ID of the ticket to update.
 * @param newStatus The new status for the ticket.
 * @param newAssigneeId The ID of the new assignee (optional, use empty string to unassign).
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function updateJiraTicketAction(
  ticketId: string,
  newStatus: JiraTicketStatus,
  newAssigneeId?: string
): Promise<UpdateJiraTicketResult> {
  if (!ticketId || !newStatus) {
    return { success: false, error: "Ticket ID and new status are required." };
  }

  try {
    const updatedTicket = await updateJiraTicket(ticketId, newStatus, newAssigneeId);
    if (updatedTicket) {
      revalidatePath("/dashboard"); 
      revalidatePath(`/jira/${ticketId}`); 
      revalidatePath("/jira"); 
      revalidatePath("/my-tickets"); 
      revalidatePath("/profile"); // Revalidate profile if relevant
      return { success: true, ticket: updatedTicket };
    } else {
      return { success: false, error: "Failed to update ticket. Ticket not found or API error." };
    }
  } catch (error) {
    console.error("Error updating Jira ticket:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred during ticket update.";
    return { success: false, error: errorMessage };
  }
}

interface CreateJiraTicketResult {
  success: boolean;
  ticket?: JiraTicket;
  error?: string;
}

export interface CreateTicketActionFormValues {
  title: string;
  description: string;
  priority: JiraTicketPriority;
  requestingUserId: string; 
  provider?: JiraTicketProvider; // Now correctly passed from dialog for both roles
  branch?: JiraTicketBranch;
  attachmentNames?: string[];
}


/**
 * Server action to create a new Jira ticket.
 * @param data The data for the new ticket from the form.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function createJiraTicketAction(
  data: CreateTicketActionFormValues
): Promise<CreateJiraTicketResult> {
  if (!data.title || !data.description || !data.priority || !data.requestingUserId) {
    return { success: false, error: "Todos los campos obligatorios deben ser completados." };
  }

  try {
    const createData: CreateJiraTicketData = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      requestingUserId: data.requestingUserId,
      provider: data.provider, // This will be set if client is TLA/FEMA, or if admin sets it
      branch: data.branch, // Will be undefined if client role or not set by admin
      attachmentNames: data.attachmentNames || [], 
    };

    const newTicket = await createJiraTicketService(createData);
    if (newTicket) {
      revalidatePath("/dashboard");
      revalidatePath("/jira");
      revalidatePath("/my-tickets");
      revalidatePath("/profile"); // Revalidate profile if relevant
      return { success: true, ticket: newTicket };
    } else {
      return { success: false, error: "No se pudo crear el ticket. Error de la API." };
    }
  } catch (error) {
    console.error("Error creating Jira ticket:", error);
    const errorMessage = error instanceof Error ? error.message : "Un error desconocido del servidor ocurrió durante la creación del ticket.";
    return { success: false, error: errorMessage };
  }
}
