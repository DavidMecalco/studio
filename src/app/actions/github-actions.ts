
"use server";

import { revalidatePath } from "next/cache";
import { createGitHubCommit as createGitHubCommitService, type GitHubCommit } from "@/services/github";
import { updateJiraTicket, type JiraTicketStatus } from "@/services/jira";

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
 * @param newTicketStatus The new status for the Jira ticket after commit.
 * @returns A promise that resolves to an object indicating success or failure and the created commit.
 */
export async function createCommitAndPushAction(
  ticketId: string,
  commitMessage: string,
  authorUsername: string,
  fileNames: string[],
  branch: string = "dev",
  newTicketStatus: JiraTicketStatus = "En Progreso"
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

    // Step 2: Update the Jira ticket status
    // For assignee, we'll keep the current one or leave as is if not directly changing it here
    const updatedTicket = await updateJiraTicket(ticketId, newTicketStatus); 

    if (!updatedTicket) {
        // Log this, but maybe the commit was still "successful" in terms of git
        console.warn(`Commit ${newCommit.sha} created, but failed to update Jira ticket ${ticketId} status.`);
        // Depending on requirements, you might want to roll back or flag this.
        // For now, we'll consider the commit part successful if it reached here.
    }

    // Step 3: Revalidate paths
    revalidatePath(`/jira/${ticketId}`);
    revalidatePath("/jira");
    revalidatePath("/dashboard");
    revalidatePath("/github"); // If commits are displayed on a general GitHub page

    return { success: true, commit: newCommit };

  } catch (error) {
    console.error("Error in createCommitAndPushAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred.";
    return { success: false, error: errorMessage };
  }
}
