
"use server";

import type { JiraTicket, JiraTicketStatus, JiraTicketProvider, JiraTicketBranch, CreateJiraTicketData, JiraTicketPriority } from "@/services/jira";
import { updateJiraTicket as updateJiraTicketServiceCall, createJiraTicket as createJiraTicketService } from "@/services/jira"; // Renamed to avoid conflict
import { revalidatePath } from "next/cache";

interface UpdateJiraTicketResult {
  success: boolean;
  ticket?: JiraTicket;
  error?: string;
}

/**
 * Server action to update a Jira ticket's status and/or assignee.
 * @param ticketId The ID of the ticket to update.
 * @param newStatus The new status for the ticket. If undefined, status is not changed.
 * @param newAssigneeId The ID of the new assignee. If undefined, assignee is not changed. If an empty string, ticket is unassigned.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function updateJiraTicketAction(
  ticketId: string,
  newStatus?: JiraTicketStatus,
  newAssigneeId?: string // undefined means don't change, "" means unassign
): Promise<UpdateJiraTicketResult> {
  if (!ticketId) {
    return { success: false, error: "Ticket ID is required." };
  }
  if (newStatus === undefined && newAssigneeId === undefined) {
    return { success: false, error: "Either new status or new assignee ID must be provided." };
  }

  try {
    const updatedTicket = await updateJiraTicketServiceCall(ticketId, newStatus, newAssigneeId);
    if (updatedTicket) {
      // Revalidate specific paths that display this ticket or lists of tickets
      revalidatePath("/(app)/dashboard", "page");
      revalidatePath(`/(app)/jira/${ticketId}`, "page");
      revalidatePath("/(app)/jira", "page");
      revalidatePath("/(app)/my-tickets", "page");
      // Removed profile revalidation as it's less likely to be directly affected by general ticket updates
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
  provider?: JiraTicketProvider; 
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
      provider: data.provider, 
      branch: data.branch, 
      attachmentNames: data.attachmentNames || [], 
    };

    const newTicket = await createJiraTicketService(createData);
    if (newTicket) {
      revalidatePath("/(app)/dashboard", "page");
      revalidatePath("/(app)/jira", "page");
      revalidatePath("/(app)/my-tickets", "page");
      // Revalidate the new ticket's detail page if it exists (though it's dynamic)
      // revalidatePath(`/(app)/jira/${newTicket.id}`, "page"); // This might be less effective for new dynamic routes immediately
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
