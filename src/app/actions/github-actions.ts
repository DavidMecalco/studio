
"use server";

import { revalidatePath } from "next/cache";
import { createGitHubCommit as createGitHubCommitService, type GitHubCommit } from "@/services/github";
import { addCommitToTicketHistory, type TicketStatus, updateTicket } from "@/services/tickets"; // Updated import
import { getUserById } from "@/services/users"; 
import { isFirebaseProperlyConfigured } from "@/lib/firebase"; 

interface CreateCommitResult {
  success: boolean;
  commit?: GitHubCommit;
  error?: string;
}

/**
 * Server action to create a new GitHub commit associated with a Ticket
 * and update the ticket's status.
 * @param ticketId The ID of the Ticket.
 * @param commitMessage The main commit message (ticket ID will be prepended).
 * @param authorUsername The username of the commit author.
 * @param branch The branch to commit to (default 'dev').
 * @param newTicketStatus The new status to set for the ticket.
 * @returns A promise that resolves to an object indicating success or failure and the created commit.
 */
export async function createCommitAndPushAction(
  ticketId: string,
  commitMessage: string,
  authorUsername: string,
  branch: string = "dev",
  newTicketStatus: TicketStatus 
): Promise<CreateCommitResult> {
  if (!ticketId || !commitMessage || !authorUsername) {
    return { success: false, error: "Ticket ID, commit message, and author are required." };
  }

  try {
    const newCommit = await createGitHubCommitService(
      ticketId,
      commitMessage,
      authorUsername,
      branch
    );

    if (!newCommit) {
      return { success: false, error: "Failed to create GitHub commit." };
    }

    const ticketWithCommitHistory = await addCommitToTicketHistory(
        ticketId, 
        newCommit.sha, 
        authorUsername, 
        commitMessage, 
        branch
    );

    if (!ticketWithCommitHistory) {
        console.warn(`Commit ${newCommit.sha} created, but failed to add commit to Ticket ${ticketId} history or update status.`);
    } else if (newTicketStatus && ticketWithCommitHistory.status !== newTicketStatus) {
        await updateTicket(ticketId, authorUsername, { newStatus: newTicketStatus });
    }


    revalidatePath(`/(app)/tickets/${ticketId}`); // Updated path
    revalidatePath("/(app)/tickets"); // Updated path
    revalidatePath("/(app)/dashboard");
    revalidatePath("/(app)/github"); 

    if (isFirebaseProperlyConfigured) {
      const committer = await getUserById(authorUsername);
      const ticketRequester = ticketWithCommitHistory ? await getUserById(ticketWithCommitHistory.requestingUserId) : null;
      
      const notificationRecipients = new Set<string>();
      if(committer?.email) notificationRecipients.add(committer.email);
      if(ticketRequester?.email && ticketRequester.email !== committer?.email) notificationRecipients.add(ticketRequester.email);
      const superUser = await getUserById('superuser');
      if(superUser?.email) notificationRecipients.add(superUser.email);

      const notificationMessage = `New commit ${newCommit.sha.substring(0,7)} pushed to branch '${branch}' for Ticket ${ticketId} by ${committer?.name || authorUsername}. Message: "${newCommit.message}".`;
      notificationRecipients.forEach(email => {
          console.log(`Simulated Email Notification to ${email}: ${notificationMessage}`);
      });
    } else {
      console.log("Skipped GitHub commit email notification as Firebase is not properly configured.");
    }


    return { success: true, commit: newCommit };

  } catch (error) {
    console.error("Error in createCommitAndPushAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred.";
    return { success: false, error: errorMessage };
  }
}
