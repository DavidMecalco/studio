
"use server";

import { revalidatePath } from "next/cache";
import { addRestorationToTicketHistory, getJiraTicket } from "@/services/jira";
import { getUserById } from "@/services/users"; // To get user email for notifications

interface RestoreFileVersionResult {
  success: boolean;
  error?: string;
}

/**
 * Server action to simulate restoring a file to a previous version.
 * @param userIdPerformingAction The ID of the user performing the action.
 * @param fileName The name of the file being restored.
 * @param versionIdToRestore The ID of the version to restore to.
 * @param commitSha Optional commit SHA associated with the version.
 * @param ticketId Optional ticket ID to log this restoration against.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function restoreFileVersionAction(
  userIdPerformingAction: string,
  fileName: string,
  versionIdToRestore: string,
  commitSha?: string,
  ticketId?: string
): Promise<RestoreFileVersionResult> {
  if (!userIdPerformingAction || !fileName || !versionIdToRestore) {
    return { success: false, error: "User ID, file name, and version ID are required." };
  }

  try {
    console.log(`Simulating restoration of ${fileName} to version ${versionIdToRestore} (commit: ${commitSha || 'N/A'}) by ${userIdPerformingAction}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    if (ticketId) {
      const ticketUpdateResult = await addRestorationToTicketHistory(
        ticketId,
        userIdPerformingAction,
        fileName,
        versionIdToRestore,
        commitSha
      );
      if (!ticketUpdateResult) {
        console.warn(`File ${fileName} restored, but failed to add history to ticket ${ticketId}.`);
      }
    }

    if (ticketId) {
      revalidatePath(`/(app)/jira/${ticketId}`, "page");
      revalidatePath("/(app)/jira", "page"); 
    }
    revalidatePath("/(app)/maximo", "page"); 
    revalidatePath("/(app)/dashboard", "page"); 

    // Simulate Email Notification
    const performingUser = await getUserById(userIdPerformingAction);
    const notificationRecipients = new Set<string>();
    if(performingUser?.email) notificationRecipients.add(performingUser.email);
    
    let ticketRequesterEmail: string | undefined;
    if (ticketId) {
        const ticket = await getJiraTicket(ticketId);
        if (ticket) {
            const requester = await getUserById(ticket.requestingUserId);
            if(requester?.email) ticketRequesterEmail = requester.email;
        }
    }
    if(ticketRequesterEmail && ticketRequesterEmail !== performingUser?.email) notificationRecipients.add(ticketRequesterEmail);
    
    const superUser = await getUserById('superuser');
    if(superUser?.email) notificationRecipients.add(superUser.email);

    let notificationMessage = `File '${fileName}' restored to version '${versionIdToRestore}' by ${performingUser?.name || userIdPerformingAction}.`;
    if (commitSha) notificationMessage += ` (Commit: ${commitSha.substring(0,7)})`;
    if (ticketId) notificationMessage += ` Related to Ticket: ${ticketId}.`;

    notificationRecipients.forEach(email => {
        console.log(`Simulated Email Notification to ${email}: ${notificationMessage}`);
    });

    return { success: true };

  } catch (error) {
    console.error("Error in restoreFileVersionAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred during file restoration.";
    return { success: false, error: errorMessage };
  }
}
