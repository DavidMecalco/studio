
"use server";

import type { Ticket, TicketStatus, TicketProvider, TicketBranch, CreateTicketData, TicketPriority, TicketType } from "@/services/tickets";
import { updateTicket as updateTicketServiceCall, createTicket as createTicketService, addCommentToTicket as addCommentToTicketService } from "@/services/tickets"; 
import { revalidatePath } from "next/cache";
import { getUserById } from "@/services/users"; 
import { isFirebaseProperlyConfigured } from "@/lib/firebase"; 

interface UpdateTicketResult {
  success: boolean;
  ticket?: Ticket;
  error?: string;
}

/**
 * Server action to update a Ticket's status, assignee, priority, and/or type.
 * @param ticketId The ID of the ticket to update.
 * @param userIdPerformingAction The ID of the user performing the action.
 * @param updates An object containing fields to update.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function updateTicketAction(
  ticketId: string,
  userIdPerformingAction: string,
  updates: {
    newStatus?: TicketStatus;
    newAssigneeId?: string; 
    newPriority?: TicketPriority;
    newType?: TicketType;
    comment?: string;
  }
): Promise<UpdateTicketResult> {
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
    updates.newType === undefined &&
    updates.comment === undefined
  ) {
    return { success: false, error: "At least one update (status, assignee, priority, type, or comment) must be provided." };
  }

  try {
    const updatedTicket = await updateTicketServiceCall(ticketId, userIdPerformingAction, updates);
    if (updatedTicket) {
      revalidatePath("/(app)/dashboard", "page");
      revalidatePath(`/(app)/tickets/${ticketId}`, "page"); // Updated path
      revalidatePath("/(app)/tickets", "page"); // Updated path
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
        if (updates.newType) notificationMessage += ` Type changed to ${updates.newType}.`;
        if (updates.comment && updates.newStatus !== 'Reabierto') notificationMessage += ` Comment: "${updates.comment}".`; 
        
        notificationRecipients.forEach(email => {
            console.log(`Simulated Email Notification to ${email}: ${notificationMessage}`);
        });
      } else {
        console.log("Skipped Ticket update email notification as Firebase is not properly configured.");
      }
      
      return { success: true, ticket: updatedTicket };
    } else {
      return { success: false, error: "Failed to update ticket. Ticket not found or API error." };
    }
  } catch (error) {
    console.error("Error updating Ticket:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred during ticket update.";
    return { success: false, error: errorMessage };
  }
}

interface CreateTicketResult {
  success: boolean;
  ticket?: Ticket;
  error?: string;
}

export interface CreateTicketActionFormValues {
  title: string;
  description: string;
  priority: TicketPriority;
  type: TicketType;
  requestingUserId: string; 
  requestingUserEmail?: string; 
  provider?: TicketProvider; 
  branch?: TicketBranch; 
  attachmentNames?: string[];
}


/**
 * Server action to create a new Ticket.
 * @param data The data for the new ticket from the form.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function createTicketAction(
  data: CreateTicketActionFormValues
): Promise<CreateTicketResult> {
  if (!data.title || !data.description || !data.priority || !data.type || !data.requestingUserId) {
    return { success: false, error: "Todos los campos obligatorios deben ser completados." };
  }
  const requestingUser = await getUserById(data.requestingUserId); 
  if (requestingUser?.role === 'client' && !data.branch) {
    return { success: false, error: "El ambiente/branch es obligatorio para los clientes." };
  }


  try {
    const createData: CreateTicketData = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      type: data.type,
      requestingUserId: data.requestingUserId,
      provider: data.provider, 
      branch: data.branch, 
      attachmentNames: data.attachmentNames || [],
    };

    const newTicket = await createTicketService(createData);
    if (newTicket) {
      revalidatePath("/(app)/dashboard", "page");
      revalidatePath("/(app)/tickets", "page"); 
      revalidatePath("/(app)/my-tickets", "page"); 

      if (isFirebaseProperlyConfigured) {
        const notificationRecipients = new Set<string>();
        if (data.requestingUserEmail) notificationRecipients.add(data.requestingUserEmail);
        
        const superUser = await getUserById('superuser'); 
        if (superUser?.email) notificationRecipients.add(superUser.email);
        
        let notificationMessage = `New Ticket Created: ${newTicket.id} - "${newTicket.title}" by ${data.requestingUserId}. Type: ${newTicket.type}. Priority: ${newTicket.priority}.`;
        if (newTicket.branch) {
          notificationMessage += ` Environment/Branch: ${newTicket.branch}.`;
        }
        notificationMessage += ` Ticket is currently unassigned.`
        notificationRecipients.forEach(email => {
            console.log(`Simulated Email Notification to ${email}: ${notificationMessage}`);
        });
      } else {
        console.log("Skipped Ticket creation email notification as Firebase is not properly configured.");
      }


      return { success: true, ticket: newTicket };
    } else {
      return { success: false, error: "No se pudo crear el ticket. Error de la API." };
    }
  } catch (error) {
    console.error("Error creating Ticket:", error);
    const errorMessage = error instanceof Error ? error.message : "Un error desconocido del servidor ocurrió durante la creación del ticket.";
    return { success: false, error: errorMessage };
  }
}


interface AddCommentResult {
  success: boolean;
  ticket?: Ticket; 
  error?: string;
}

/**
 * Server action to add a comment to a Ticket.
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
      revalidatePath(`/(app)/tickets/${ticketId}`, "page"); // Updated path

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
        console.log("Skipped Ticket comment email notification as Firebase is not properly configured.");
      }

      return { success: true, ticket: updatedTicket };
    } else {
      return { success: false, error: "Failed to add comment. Ticket not found or API error." };
    }
  } catch (error) {
    console.error("Error adding comment to Ticket:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred while adding comment.";
    return { success: false, error: errorMessage };
  }
}

