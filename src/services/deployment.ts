
import type { JiraTicket } from './jira'; 
import { addDeploymentToTicketHistory } from './jira';

export type DeploymentEnvironment = 'DEV' | 'QA' | 'PROD' | 'Staging' | 'Other';
export type DeploymentStatus = 'Success' | 'Failure' | 'In Progress' | 'Pending';

export interface DeploymentLogEntry {
  id: string;
  timestamp: string;
  userId: string; 
  filesDeployed: Array<{ name: string; version?: string; type: 'script' | 'xml' | 'report' | 'other' }>;
  environment: DeploymentEnvironment;
  status: DeploymentStatus;
  resultCode?: string; 
  message?: string; 
  ticketIds?: string[]; 
}

let mockDeploymentLogs: DeploymentLogEntry[] = [];
let mockDeploymentLogsInitialized = false;

function initializeMockDeploymentLogs() {
    if (mockDeploymentLogsInitialized) return;
    mockDeploymentLogs = [
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
    mockDeploymentLogsInitialized = true;
}

initializeMockDeploymentLogs();

/**
 * Asynchronously retrieves all deployment logs.
 * @returns A promise that resolves to an array of DeploymentLogEntry objects.
 */
export async function getDeploymentLogs(): Promise<DeploymentLogEntry[]> {
  await new Promise(resolve => setTimeout(resolve, 50)); // Reduced delay
  return JSON.parse(JSON.stringify(mockDeploymentLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())));
}

/**
 * Asynchronously retrieves a specific deployment log by its ID.
 * @param deploymentId The ID of the deployment log to retrieve.
 * @returns A promise that resolves to a DeploymentLogEntry object or null if not found.
 */
export async function getDeploymentLogById(deploymentId: string): Promise<DeploymentLogEntry | null> {
    await new Promise(resolve => setTimeout(resolve, 20)); // Reduced delay
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
 * @param data The data for the new deployment log.
 * @returns A promise that resolves to the created DeploymentLogEntry object.
 */
export async function createDeploymentLog(data: CreateDeploymentLogData): Promise<DeploymentLogEntry> {
  await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay

  const newLogEntry: DeploymentLogEntry = {
    id: `deploy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...data,
  };

  mockDeploymentLogs.unshift(newLogEntry); 
  return JSON.parse(JSON.stringify(newLogEntry));
}
