"use server";

import type { JiraTicket, JiraTicketStatus } from "@/services/jira";
import { updateJiraTicket } from "@/services/jira";
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
      revalidatePath("/dashboard"); // Revalidate dashboard to show updated KPIs
      revalidatePath(`/jira/${ticketId}`); // Revalidate specific ticket page
      revalidatePath("/jira"); // Revalidate jira list page
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