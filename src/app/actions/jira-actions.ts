
"use server";

import type { JiraTicket, JiraTicketStatus, JiraTicketProvider, JiraTicketBranch, CreateJiraTicketData, JiraTicketPriority } from "@/services/jira";
import { updateJiraTicket as updateJiraTicketServiceCall, createJiraTicket as createJiraTicketService, addCommentToTicket as addCommentToTicketService, addAttachmentsToJiraTicket as addAttachmentsToJiraTicketService } from "@/services/jira"; 
import { revalidatePath } from "next/cache";
import { getUserById } from "@/services/users"; 
import { isFirebaseProperlyConfigured } from "@/lib/firebase"; // Import the flag

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
  newAssigneeId?: string, 
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
      revalidatePath("/(app)/dashboard", "page");
      revalidatePath(`/(app)/jira/${ticketId}`, "page");
      revalidatePath("/(app)/jira", "page");
      revalidatePath("/(app)/my-tickets", "page");

      // Simulate Email Notification
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
        if (newStatus) {
            notificationMessage += ` New status: ${newStatus}.`;
            if (newStatus === 'Reabierto' && comment) {
                 // Comment is already included in the history, so we don't need to add it here explicitly
            } else if (newStatus === 'Reabierto') {
                 notificationMessage += ` Ticket has been reopened.`;
            }
        }
        if (newAssigneeId !== undefined) notificationMessage += ` Assignee changed to ${newAssigneeId || 'Unassigned'}.`;
        if (comment && newStatus !== 'Reabierto') notificationMessage += ` Comment: "${comment}".`; // Avoid duplicating comment if it was part of reopen
        
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

      // Simulate Email Notification
      if (isFirebaseProperlyConfigured) {
        const notificationRecipients = new Set<string>();
        if (data.requestingUserEmail) notificationRecipients.add(data.requestingUserEmail);
        
        const superUser = await getUserById('superuser'); 
        if (superUser?.email) notificationRecipients.add(superUser.email);
        
        const notificationMessage = `New Ticket Created: ${newTicket.id} - "${newTicket.title}" by ${data.requestingUserId}. Priority: ${newTicket.priority}.`;
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

      // Simulate Email Notification for comment
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
        
        const notificationMessage = `New comment on Ticket ${ticketId} by ${performingUser?.name || userIdPerformingAction}: "${commentText}"`;
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

interface AddAttachmentsResult {
  success: boolean;
  ticket?: JiraTicket;
  error?: string;
}

/**
 * Server action to add attachments to a Jira ticket.
 * @param ticketId The ID of the ticket.
 * @param userIdPerformingAction The ID of the user adding the attachments.
 * @param attachmentNames An array of names for the files being attached.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function addAttachmentsToTicketAction(
  ticketId: string,
  userIdPerformingAction: string,
  attachmentNames: string[]
): Promise<AddAttachmentsResult> {
  if (!ticketId || !userIdPerformingAction || !attachmentNames || attachmentNames.length === 0) {
    return { success: false, error: "Ticket ID, user ID, and at least one attachment name are required." };
  }

  try {
    const updatedTicket = await addAttachmentsToJiraTicketService(ticketId, userIdPerformingAction, attachmentNames);
    if (updatedTicket) {
      revalidatePath(`/(app)/jira/${ticketId}`, "page");

      // Simulate Email Notification for attachments
      if (isFirebaseProperlyConfigured) {
        const performingUser = await getUserById(userIdPerformingAction);
        const requester = await getUserById(updatedTicket.requestingUserId);
        const assignee = updatedTicket.assigneeId ? await getUserById(updatedTicket.assigneeId) : null;

        const notificationRecipients = new Set<string>();
        // Notify performing user, requester, assignee, and superuser
        if (performingUser?.email) notificationRecipients.add(performingUser.email);
        if (requester?.email) notificationRecipients.add(requester.email);
        if (assignee?.email) notificationRecipients.add(assignee.email);
        const superUser = await getUserById('superuser');
        if (superUser?.email) notificationRecipients.add(superUser.email);
        
        // Remove performing user from recipients if they are also requester/assignee/superuser to avoid duplicate notifications
        if (requester?.email === performingUser?.email) notificationRecipients.delete(requester.email);
        if (assignee?.email === performingUser?.email) notificationRecipients.delete(assignee.email);
        if (superUser?.email === performingUser?.email) notificationRecipients.delete(superUser.email);


        const filesString = attachmentNames.join(', ');
        const notificationMessage = `New attachments added to Ticket ${ticketId} by ${performingUser?.name || userIdPerformingAction}: ${filesString}`;
        
        notificationRecipients.forEach(email => {
            console.log(`Simulated Email Notification to ${email}: ${notificationMessage}`);
        });
      } else {
        console.log("Skipped Jira attachment email notification as Firebase is not properly configured.");
      }

      return { success: true, ticket: updatedTicket };
    } else {
      return { success: false, error: "Failed to add attachments. Ticket not found or API error." };
    }
  } catch (error) {
    console.error("Error adding attachments to Jira ticket:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred while adding attachments.";
    return { success: false, error: errorMessage };
  }
}
