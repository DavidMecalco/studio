"use server";

import { revalidatePath } from "next/cache";
import { createGitHubCommit as createGitHubCommitService, type GitHubCommit } from "@/services/github";
import { addCommitToTicketHistory, type JiraTicketStatus, updateJiraTicket } from "@/services/jira";

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
    // Step 1: Create the GitHub commit (simulated)
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

    // Step 2: Add commit to ticket history (this also updates status if needed)
    const ticketWithCommitHistory = await addCommitToTicketHistory(
        ticketId, 
        newCommit.sha, 
        authorUsername, 
        commitMessage, 
        branch
    );

    if (!ticketWithCommitHistory) {
        console.warn(`Commit ${newCommit.sha} created, but failed to add commit to Jira ticket ${ticketId} history or update status.`);
        // Depending on requirements, you might want to roll back or flag this.
    }

    // Step 3: Revalidate paths
    revalidatePath(`/jira/${ticketId}`);
    revalidatePath("/jira");
    revalidatePath("/dashboard");
    revalidatePath("/github"); 

    return { success: true, commit: newCommit };

  } catch (error) {
    console.error("Error in createCommitAndPushAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred.";
    return { success: false, error: errorMessage };
  }
}
