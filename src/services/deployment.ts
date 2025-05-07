import type { JiraTicket } from './jira'; // For linking tickets
import { addDeploymentToTicketHistory } from './jira';

export type DeploymentEnvironment = 'DEV' | 'QA' | 'PROD' | 'Staging' | 'Other';
export type DeploymentStatus = 'Success' | 'Failure' | 'In Progress' | 'Pending';

export interface DeploymentLogEntry {
  id: string;
  timestamp: string;
  userId: string; // User who initiated the deployment
  filesDeployed: Array<{ name: string; version?: string; type: 'script' | 'xml' | 'report' | 'other' }>;
  environment: DeploymentEnvironment;
  status: DeploymentStatus;
  resultCode?: string; // e.g., HTTP status or custom code
  message?: string; // Optional message, e.g., error details
  ticketIds?: string[]; // Associated Jira ticket IDs
}

let mockDeploymentLogs: DeploymentLogEntry[] = [
  {
    id: 'deploy-1',
    timestamp: '2024-07-25T10:00:00Z',
    userId: 'admin',
    filesDeployed: [
      { name: 'script_ABC.py', version: '1.2', type: 'script' },
      { name: 'config_XYZ.xml', type: 'xml' },
    ],
    environment: 'DEV',
    status: 'Success',
    resultCode: '200',
    ticketIds: ['MAX-123'],
  },
  {
    id: 'deploy-2',
    timestamp: '2024-07-26T14:30:00Z',
    userId: 'another-admin',
    filesDeployed: [{ name: 'report_finance.rptdesign', type: 'report' }],
    environment: 'QA',
    status: 'Failure',
    resultCode: '500',
    message: 'Database connection timeout during deployment.',
    ticketIds: ['MAX-456'],
  },
];

/**
 * Asynchronously retrieves all deployment logs.
 * @returns A promise that resolves to an array of DeploymentLogEntry objects.
 */
export async function getDeploymentLogs(): Promise<DeploymentLogEntry[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return JSON.parse(JSON.stringify(mockDeploymentLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())));
}

/**
 * Asynchronously retrieves a specific deployment log by its ID.
 * @param deploymentId The ID of the deployment log to retrieve.
 * @returns A promise that resolves to a DeploymentLogEntry object or null if not found.
 */
export async function getDeploymentLogById(deploymentId: string): Promise<DeploymentLogEntry | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const log = mockDeploymentLogs.find(d => d.id === deploymentId);
    return log ? JSON.parse(JSON.stringify(log)) : null;
}


export interface CreateDeploymentLogData {
  userId: string;
  filesDeployed: Array<{ name: string; version?: string; type: 'script' | 'xml' | 'report' | 'other' }>;
  environment: DeploymentEnvironment;
  status: DeploymentStatus;
  resultCode?: string;
  message?: string;
  ticketIds?: string[];
}

/**
 * Asynchronously creates a new deployment log entry.
 * Also adds a history entry to associated Jira tickets.
 * @param data The data for the new deployment log.
 * @returns A promise that resolves to the created DeploymentLogEntry object.
 */
export async function createDeploymentLog(data: CreateDeploymentLogData): Promise<DeploymentLogEntry> {
  await new Promise(resolve => setTimeout(resolve, 400));
  const newLog: DeploymentLogEntry = {
    id: `deploy-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...data,
  };
  mockDeploymentLogs.unshift(newLog);

  // Add history to associated tickets
  if (data.ticketIds && data.ticketIds.length > 0) {
    for (const ticketId of data.ticketIds) {
      await addDeploymentToTicketHistory(ticketId, newLog.id, data.userId, data.environment, data.status);
    }
  }

  return JSON.parse(JSON.stringify(newLog));
}

// Example: Get all actions for audit log (combining ticket history and deployments)
export async function getAllAuditableActions(): Promise<Array<any>> {
    // This is a simplified version. A real audit service would likely query
    // different data sources and normalize them into a common format.
    const jiraService = await import('@/services/jira'); // Dynamic import to avoid circular dependency issues if any
    
    const ticketHistories = await jiraService.getAllTicketHistories();
    const deploymentLogsData = await getDeploymentLogs();

    const combinedLogs = [
        ...ticketHistories.map(th => ({ ...th, type: 'TicketEvent', eventId: th.id })),
        ...deploymentLogsData.map(dl => ({ ...dl, type: 'DeploymentEvent', eventId: dl.id, action: `Deployed to ${dl.environment}`}))
    ];

    return combinedLogs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}