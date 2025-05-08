
"use server";

import type { Ticket, TicketStatus, TicketProvider, TicketBranch, CreateTicketData, TicketPriority, TicketType, TicketHistoryEntry } from "@/services/tickets";
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

  if (!isFirebaseProperlyConfigured) {
    console.warn(`[ACTION updateTicketAction] Firebase is not configured. This action cannot persist data on the server side without Firebase for ticket ${ticketId}.`);
    // Simulate success for client-side optimistic updates if needed, but data won't be saved server-side.
    // For now, we'll let it try the service call which will also fail gracefully if Firebase is down.
    // Alternatively, return a simulated success here too.
  }

  try {
    const updatedTicket = await updateTicketServiceCall(ticketId, userIdPerformingAction, updates);
    if (updatedTicket) {
      revalidatePath("/(app)/dashboard", "page");
      revalidatePath(`/(app)/tickets/${ticketId}`, "page");
      revalidatePath("/(app)/tickets", "page");
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
      return { success: false, error: "Failed to update ticket. Ticket not found or an error occurred with the data service." };
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

  if (!isFirebaseProperlyConfigured) {
    console.warn("[ACTION createTicketAction] Firebase is not configured on the server. Simulating ticket creation for client-side handling. NO DATA WILL BE PERSISTED CENTRALLY BY THIS SERVER ACTION.");
    
    // Simulate ticket creation
    const newTicketId = `SIM-${Math.floor(Math.random() * 9000) + 1000}`; // Indicate it's simulated
    const timestamp = new Date().toISOString();
    const initialHistoryEntry: TicketHistoryEntry = {
      id: `hist-sim-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
      timestamp,
      userId: data.requestingUserId,
      action: 'Created (Simulated Server Action)',
      details: 'Ticket Creado (Simulado en el servidor, no persistido centralmente)',
      toStatus: 'Abierto',
      toType: data.type,
      ticketId: newTicketId,
    };

    const simulatedTicket: Ticket = {
      id: newTicketId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      type: data.type,
      requestingUserId: data.requestingUserId,
      status: 'Abierto',
      provider: data.provider,
      branch: data.branch,
      attachmentNames: data.attachmentNames || [],
      assigneeId: undefined, 
      lastUpdated: timestamp,
      history: [initialHistoryEntry],
      githubRepository: data.provider ? `sim-repo/${data.provider.toLowerCase().replace(/[^a-z0-9-]/gi, '')}` : undefined,
    };
    
    // Simulate email notifications for the simulated ticket
    const notificationRecipients = new Set<string>();
    if (data.requestingUserEmail) notificationRecipients.add(data.requestingUserEmail);
    // Superuser notification would require a reliable getUserById, which might fail if Firebase is down.
    // So, for simulation, focus on requester.
    let notificationMessage = `[SIMULATED SERVER ACTION] New Ticket Created: ${simulatedTicket.id} - "${simulatedTicket.title}" by ${data.requestingUserId}. Type: ${simulatedTicket.type}. Priority: ${simulatedTicket.priority}.`;
     if (simulatedTicket.branch) {
        notificationMessage += ` Environment/Branch: ${simulatedTicket.branch}.`;
    }
    notificationMessage += ` Ticket is currently unassigned.`

    notificationRecipients.forEach(email => {
        console.log(`Simulated Email Notification to ${email}: ${notificationMessage}`);
    });
    console.log("Simulated superuser notification for ticket creation would occur here if user service was available.");


    // Important: RevalidatePath will not reflect actual data changes as nothing was saved on server.
    // Client-side calling this action needs to handle the UI update and local storage.
    return { success: true, ticket: simulatedTicket };
  }

  // Original logic if Firebase IS configured
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
        console.log("Skipped Ticket creation email notification as Firebase (for user lookup/notifications) is not properly configured.");
      }

      return { success: true, ticket: newTicket };
    } else {
      return { success: false, error: "No se pudo crear el ticket. Error del servicio de datos." };
    }
  } catch (error) {
    console.error("Error creating Ticket in Action:", error);
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

  if (!isFirebaseProperlyConfigured) {
    console.warn(`[ACTION addCommentToTicketAction] Firebase is not configured. This action cannot persist data on the server side for ticket ${ticketId}.`);
    // Similar to createTicketAction, we could simulate success here if desired.
    // For now, let it try the service call.
  }

  try {
    const updatedTicket = await addCommentToTicketService(ticketId, userIdPerformingAction, commentText, attachmentNames);
    if (updatedTicket) {
      revalidatePath(`/(app)/tickets/${ticketId}`, "page");

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
      return { success: false, error: "Failed to add comment. Ticket not found or an error occurred with the data service." };
    }
  } catch (error) {
    console.error("Error adding comment to Ticket:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred while adding comment.";
    return { success: false, error: errorMessage };
  }
}

    
