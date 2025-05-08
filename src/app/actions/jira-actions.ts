

"use server";

import type { JiraTicket, JiraTicketStatus, JiraTicketProvider, JiraTicketBranch, CreateJiraTicketData, JiraTicketPriority, JiraTicketType } from "@/services/jira"; // Added JiraTicketType
import { updateJiraTicket as updateJiraTicketServiceCall, createJiraTicket as createJiraTicketService, addCommentToTicket as addCommentToTicketService } from "@/services/jira"; 
import { revalidatePath } from "next/cache";
import { getUserById } from "@/services/users"; 
import { isFirebaseProperlyConfigured } from "@/lib/firebase"; 

interface UpdateJiraTicketResult {
  success: boolean;
  ticket?: JiraTicket;
  error?: string;
}

/**
 * Server action to update a Jira ticket's status, assignee, priority, and/or type.
 * @param ticketId The ID of the ticket to update.
 * @param userIdPerformingAction The ID of the user performing the action.
 * @param updates An object containing fields to update.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function updateJiraTicketAction(
  ticketId: string,
  userIdPerformingAction: string,
  updates: {
    newStatus?: JiraTicketStatus;
    newAssigneeId?: string; 
    newPriority?: JiraTicketPriority;
    newType?: JiraTicketType; // Added newType
    comment?: string;
  }
): Promise<UpdateJiraTicketResult> {
  if (!ticketId) {
    return { success: false, error: "Ticket ID is required." };
  }
  if (!userIdPerformingAction) {
    return { success: false, error: "User ID performing action is required." };
  }
  if (
    updates.newStatus === undefined &&
    updates.newAssigneeId === undefined &&
    updates.newPriority === undefined &&
    updates.newType === undefined && // Added newType check
    updates.comment === undefined
  ) {
    return { success: false, error: "At least one update (status, assignee, priority, type, or comment) must be provided." };
  }

  try {
    const updatedTicket = await updateJiraTicketServiceCall(ticketId, userIdPerformingAction, updates);
    if (updatedTicket) {
      revalidatePath("/(app)/dashboard", "page");
      revalidatePath(`/(app)/jira/${ticketId}`, "page");
      revalidatePath("/(app)/jira", "page");
      revalidatePath("/(app)/my-tickets", "page");

      if (isFirebaseProperlyConfigured) {
        const performingUser = await getUserById(userIdPerformingAction);
        const requester = await getUserById(updatedTicket.requestingUserId);
        const assignee = updatedTicket.assigneeId ? await getUserById(updatedTicket.assigneeId) : null;

        const notificationRecipients = new Set<string>();
        if (performingUser?.email) notificationRecipients.add(performingUser.email);
        if (requester?.email) notificationRecipients.add(requester.email);
        if (assignee?.email) notificationRecipients.add(assignee.email);
        
        const superUser = await getUserById('superuser'); 
        if(superUser?.email) notificationRecipients.add(superUser.email);


        let notificationMessage = `Ticket ${ticketId} updated by ${performingUser?.name || userIdPerformingAction}.`;
        if (updates.newStatus) {
            notificationMessage += ` New status: ${updates.newStatus}.`;
            if (updates.newStatus === 'Reabierto' && updates.comment) {
            } else if (updates.newStatus === 'Reabierto') {
                 notificationMessage += ` Ticket has been reopened.`;
            }
        }
        if (updates.newAssigneeId !== undefined) notificationMessage += ` Assignee changed to ${updates.newAssigneeId || 'Unassigned'}.`;
        if (updates.newPriority) notificationMessage += ` Priority changed to ${updates.newPriority}.`;
        if (updates.newType) notificationMessage += ` Type changed to ${updates.newType}.`; // Added type change notification
        if (updates.comment && updates.newStatus !== 'Reabierto') notificationMessage += ` Comment: "${updates.comment}".`; 
        
        notificationRecipients.forEach(email => {
            console.log(`Simulated Email Notification to ${email}: ${notificationMessage}`);
        });
      } else {
        console.log("Skipped Jira ticket update email notification as Firebase is not properly configured.");
      }
      
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
  type: JiraTicketType; // Added type
  requestingUserId: string; 
  requestingUserEmail?: string; 
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
  if (!data.title || !data.description || !data.priority || !data.type || !data.requestingUserId) { // Added type check
    return { success: false, error: "Todos los campos obligatorios deben ser completados." };
  }
  const requestingUser = await getUserById(data.requestingUserId); 
  if (requestingUser?.role === 'client' && !data.branch) {
    return { success: false, error: "El ambiente/branch es obligatorio para los clientes." };
  }


  try {
    const createData: CreateJiraTicketData = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      type: data.type, // Pass type
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

      if (isFirebaseProperlyConfigured) {
        const notificationRecipients = new Set<string>();
        if (data.requestingUserEmail) notificationRecipients.add(data.requestingUserEmail);
        
        const superUser = await getUserById('superuser'); 
        if (superUser?.email) notificationRecipients.add(superUser.email);
        
        let notificationMessage = `New Ticket Created: ${newTicket.id} - "${newTicket.title}" by ${data.requestingUserId}. Type: ${newTicket.type}. Priority: ${newTicket.priority}.`; // Added type
        if (newTicket.branch) {
          notificationMessage += ` Environment/Branch: ${newTicket.branch}.`;
        }
        notificationMessage += ` Ticket is currently unassigned.`
        notificationRecipients.forEach(email => {
            console.log(`Simulated Email Notification to ${email}: ${notificationMessage}`);
        });
      } else {
        console.log("Skipped Jira ticket creation email notification as Firebase is not properly configured.");
      }


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
  ticket?: JiraTicket; 
  error?: string;
}

/**
 * Server action to add a comment to a Jira ticket.
 * @param ticketId The ID of the ticket.
 * @param userIdPerformingAction The ID of the user adding the comment.
 * @param commentText The text of the comment.
 * @param attachmentNames Optional array of names for files attached with this comment.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function addCommentToTicketAction(
  ticketId: string,
  userIdPerformingAction: string,
  commentText: string,
  attachmentNames?: string[] 
): Promise<AddCommentResult> {
  if (!ticketId || !userIdPerformingAction || !commentText) {
    return { success: false, error: "Ticket ID, user ID, and comment text are required." };
  }

  try {
    const updatedTicket = await addCommentToTicketService(ticketId, userIdPerformingAction, commentText, attachmentNames);
    if (updatedTicket) {
      revalidatePath(`/(app)/jira/${ticketId}`, "page");

      if (isFirebaseProperlyConfigured) {
        const performingUser = await getUserById(userIdPerformingAction);
        const requester = await getUserById(updatedTicket.requestingUserId);
        const assignee = updatedTicket.assigneeId ? await getUserById(updatedTicket.assigneeId) : null;

        const notificationRecipients = new Set<string>();
        if (performingUser?.email && performingUser.email !== requester?.email) notificationRecipients.add(performingUser.email); 
        if (requester?.email) notificationRecipients.add(requester.email);
        if (assignee?.email && assignee.email !== performingUser?.email) notificationRecipients.add(assignee.email);
        const superUser = await getUserById('superuser');
        if(superUser?.email) notificationRecipients.add(superUser.email);
        
        let notificationMessage = `New comment on Ticket ${ticketId} by ${performingUser?.name || userIdPerformingAction}: "${commentText}"`;
        if (attachmentNames && attachmentNames.length > 0) {
            notificationMessage += ` Attachments: ${attachmentNames.join(', ')}.`;
        }

        notificationRecipients.forEach(email => {
            console.log(`Simulated Email Notification to ${email}: ${notificationMessage}`);
        });
      } else {
        console.log("Skipped Jira comment email notification as Firebase is not properly configured.");
      }

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
