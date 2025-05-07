"use server";

import type { JiraTicket, JiraTicketStatus, JiraTicketProvider, JiraTicketBranch, CreateJiraTicketData, JiraTicketPriority } from "@/services/jira";
import { updateJiraTicket as updateJiraTicketServiceCall, createJiraTicket as createJiraTicketService, addCommentToTicket as addCommentToTicketService } from "@/services/jira"; // Renamed to avoid conflict
import { revalidatePath } from "next/cache";

interface UpdateJiraTicketResult {
  success: boolean;
  ticket?: JiraTicket;
  error?: string;
}

/**
 * Server action to update a Jira ticket's status and/or assignee.
 * @param ticketId The ID of the ticket to update.
 * @param userIdPerformingAction The ID of the user performing the action.
 * @param newStatus The new status for the ticket. If undefined, status is not changed.
 * @param newAssigneeId The ID of the new assignee. If undefined, assignee is not changed. If an empty string, ticket is unassigned.
 * @param comment Optional comment for the history log.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function updateJiraTicketAction(
  ticketId: string,
  userIdPerformingAction: string,
  newStatus?: JiraTicketStatus,
  newAssigneeId?: string, // undefined means don't change, "" means unassign
  comment?: string
): Promise<UpdateJiraTicketResult> {
  if (!ticketId) {
    return { success: false, error: "Ticket ID is required." };
  }
   if (!userIdPerformingAction) {
    return { success: false, error: "User ID performing action is required." };
  }
  if (newStatus === undefined && newAssigneeId === undefined && comment === undefined) {
    return { success: false, error: "Either new status, new assignee ID, or a comment must be provided." };
  }

  try {
    const updatedTicket = await updateJiraTicketServiceCall(ticketId, newStatus, newAssigneeId, userIdPerformingAction, comment);
    if (updatedTicket) {
      // Revalidate specific paths that display this ticket or lists of tickets
      revalidatePath("/(app)/dashboard", "page");
      revalidatePath(`/(app)/jira/${ticketId}`, "page");
      revalidatePath("/(app)/jira", "page");
      revalidatePath("/(app)/my-tickets", "page");
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


interface AddCommentResult {
  success: boolean;
  ticket?: JiraTicket; // Return updated ticket with new comment in history
  error?: string;
}

/**
 * Server action to add a comment to a Jira ticket.
 * @param ticketId The ID of the ticket.
 * @param userIdPerformingAction The ID of the user adding the comment.
 * @param commentText The text of the comment.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function addCommentToTicketAction(
  ticketId: string,
  userIdPerformingAction: string,
  commentText: string
): Promise<AddCommentResult> {
  if (!ticketId || !userIdPerformingAction || !commentText) {
    return { success: false, error: "Ticket ID, user ID, and comment text are required." };
  }

  try {
    const updatedTicket = await addCommentToTicketService(ticketId, userIdPerformingAction, commentText);
    if (updatedTicket) {
      revalidatePath(`/(app)/jira/${ticketId}`, "page");
      return { success: true, ticket: updatedTicket };
    } else {
      return { success: false, error: "Failed to add comment. Ticket not found or API error." };
    }
  } catch (error) {
    console.error("Error adding comment to Jira ticket:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred while adding comment.";
    return { success: false, error: errorMessage };
  }
}
