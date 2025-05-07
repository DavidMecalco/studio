
"use server";

import { revalidatePath } from "next/cache";
import { addDeploymentToTicketHistory } from "@/services/jira";
import type { DeploymentLogEntry, CreateDeploymentLogData as ServiceCreateData } from "@/services/deployment";

// This service function will be created in services/deployment.ts
import { createDeploymentLog as createDeploymentLogService } from "@/services/deployment";

interface CreateDeploymentResult {
  success: boolean;
  log?: DeploymentLogEntry;
  error?: string;
}

/**
 * Server action to create a new deployment log and link it to Jira tickets.
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
    // Step 1: Create the deployment log (simulated)
    const newLog = await createDeploymentLogService(data);

    if (!newLog) {
      return { success: false, error: "Failed to create deployment log." };
    }

    // Step 2: If ticketIds are provided, add deployment info to their history
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
          // Decide if this should be a partial success or full failure
        }
      }
    }

    // Step 3: Revalidate paths
    revalidatePath("/(app)/deployments", "page");
    revalidatePath("/(app)/audit-log", "page"); // Audit log might show deployments
    if (newLog.ticketIds && newLog.ticketIds.length > 0) {
      newLog.ticketIds.forEach(tid => revalidatePath(`/(app)/jira/${tid}`, "page"));
      revalidatePath("/(app)/jira", "page");
    }
    revalidatePath("/(app)/dashboard", "page");

    return { success: true, log: newLog };

  } catch (error) {
    console.error("Error in createDeploymentLogAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred.";
    return { success: false, error: errorMessage };
  }
}

// Mock for createDeploymentLog in services/deployment.ts - to be moved there later
// This is a placeholder. The actual function should be in services/deployment.ts
async function createDeploymentLog(data: ServiceCreateData): Promise<DeploymentLogEntry | null> {
    // This is a mock. In a real app, this would interact with a database.
    // For now, it's included here to make the action runnable.
    // It should be moved to src/services/deployment.ts
    
    // Find the mockDeploymentLogs array (assuming it's accessible or passed)
    // This is a simplification for the current file structure.
    // Ideally, this logic would be within src/services/deployment.ts
    
    const mockDeploymentLogs: DeploymentLogEntry[] = []; // This needs to be the actual shared array

    const newLogEntry: DeploymentLogEntry = {
        id: `deploy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        userId: data.userId,
        filesDeployed: data.filesDeployed,
        environment: data.environment,
        status: data.status,
        resultCode: data.resultCode,
        message: data.message,
        ticketIds: data.ticketIds,
    };
    // This is where you would typically push to your persistent store or in-memory array
    // For this action, we'll assume it's handled by a service function that updates the shared mock array.
    // For the purpose of this example, we'll log and return.
    // A real implementation in services/deployment.ts would update `mockDeploymentLogs`.
    console.log("Simulating creation of deployment log:", newLogEntry);
    // In a real service: mockDeploymentLogs.unshift(newLogEntry);
    return newLogEntry;
}
