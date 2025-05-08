
"use server";

import { revalidatePath } from "next/cache";
import { addDeploymentToTicketHistory } from "@/services/tickets"; // Updated import
import type { DeploymentLogEntry, CreateDeploymentLogData as ServiceCreateData } from "@/services/deployment";
import { createDeploymentLog as createDeploymentLogService } from "@/services/deployment";
import { getUserById } from "@/services/users"; 
import { isFirebaseProperlyConfigured } from "@/lib/firebase"; 

interface CreateDeploymentResult {
  success: boolean;
  log?: DeploymentLogEntry;
  error?: string;
}

/**
 * Server action to create a new deployment log and link it to Tickets.
 * @param data The data for the new deployment log.
 * @returns A promise that resolves to an object indicating success or failure and the created log.
 */
export async function createDeploymentLogAction(
  data: ServiceCreateData
): Promise<CreateDeploymentResult> {
  if (!data.userId || !data.environment || !data.status || !data.filesDeployed || data.filesDeployed.length === 0) {
    return { success: false, error: "User ID, environment, status, and at least one deployed file are required." };
  }

  try {
    const newLog = await createDeploymentLogService(data);

    if (!newLog) {
      return { success: false, error: "Failed to create deployment log." };
    }

    if (newLog.ticketIds && newLog.ticketIds.length > 0) {
      for (const ticketId of newLog.ticketIds) {
        const ticketUpdateResult = await addDeploymentToTicketHistory(
          ticketId,
          newLog.id,
          newLog.userId,
          newLog.environment,
          newLog.status
        );
        if (!ticketUpdateResult) {
          console.warn(`Deployment ${newLog.id} logged, but failed to add history to ticket ${ticketId}.`);
        }
      }
    }

    revalidatePath("/(app)/deployments", "page");
    revalidatePath("/(app)/audit-log", "page"); 
    if (newLog.ticketIds && newLog.ticketIds.length > 0) {
      newLog.ticketIds.forEach(tid => revalidatePath(`/(app)/tickets/${tid}`, "page")); // Updated path
      revalidatePath("/(app)/tickets", "page"); // Updated path
    }
    revalidatePath("/(app)/dashboard", "page");

    if (isFirebaseProperlyConfigured) {
      const deployingUser = await getUserById(newLog.userId);
      const notificationRecipients = new Set<string>();
      if(deployingUser?.email) notificationRecipients.add(deployingUser.email);
      
      const superUser = await getUserById('superuser');
      if(superUser?.email) notificationRecipients.add(superUser.email);

      const filesDeployedString = newLog.filesDeployed.map(f => f.name).join(', ');
      let notificationMessage = `Deployment Logged: ID ${newLog.id} to ${newLog.environment} by ${deployingUser?.name || newLog.userId}. Status: ${newLog.status}. Files: ${filesDeployedString}.`;
      if (newLog.message) notificationMessage += ` Message: ${newLog.message}.`;
      if (newLog.ticketIds && newLog.ticketIds.length > 0) notificationMessage += ` Associated Tickets: ${newLog.ticketIds.join(', ')}.`;

      notificationRecipients.forEach(email => {
          console.log(`Simulated Email Notification to ${email}: ${notificationMessage}`);
      });
    } else {
      console.log("Skipped deployment email notification as Firebase is not properly configured.");
    }


    return { success: true, log: newLog };

  } catch (error) {
    console.error("Error in createDeploymentLogAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred.";
    return { success: false, error: errorMessage };
  }
}
