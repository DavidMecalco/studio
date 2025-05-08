
"use server";

import { revalidatePath } from "next/cache";
import { createGitHubCommit as createGitHubCommitService, type GitHubCommit } from "@/services/github";
import { addCommitToTicketHistory, type JiraTicketStatus, updateJiraTicket } from "@/services/jira";
import { getUserById } from "@/services/users"; // To get user email for notifications

interface CreateCommitResult {
  success: boolean;
  commit?: GitHubCommit;
  error?: string;
}

/**
 * Server action to create a new GitHub commit associated with a Jira ticket
 * and update the ticket's status.
 * @param ticketId The ID of the Jira ticket.
 * @param commitMessage The main commit message (ticket ID will be prepended).
 * @param authorUsername The username of the commit author.
 * @param fileNames List of files changed (simulated).
 * @param branch The branch to commit to (default 'dev').
 * @returns A promise that resolves to an object indicating success or failure and the created commit.
 */
export async function createCommitAndPushAction(
  ticketId: string,
  commitMessage: string,
  authorUsername: string,
  fileNames: string[],
  branch: string = "dev"
  // newTicketStatus is now handled by addCommitToTicketHistory
): Promise<CreateCommitResult> {
  if (!ticketId || !commitMessage || !authorUsername) {
    return { success: false, error: "Ticket ID, commit message, and author are required." };
  }

  try {
    const newCommit = await createGitHubCommitService(
      ticketId,
      commitMessage,
      authorUsername,
      fileNames,
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
        console.warn(`Commit ${newCommit.sha} created, but failed to add commit to Jira ticket ${ticketId} history or update status.`);
    }

    revalidatePath(`/jira/${ticketId}`);
    revalidatePath("/jira");
    revalidatePath("/dashboard");
    revalidatePath("/github"); 

    // Simulate Email Notification
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


    return { success: true, commit: newCommit };

  } catch (error) {
    console.error("Error in createCommitAndPushAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred.";
    return { success: false, error: errorMessage };
  }
}
