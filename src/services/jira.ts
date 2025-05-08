
/**
 * Represents the possible statuses of a Jira ticket.
 */
export type JiraTicketStatus = 'Abierto' | 'Pendiente' | 'En Progreso' | 'Resuelto' | 'Cerrado' | 'En espera del visto bueno' | 'Reabierto';

/**
 * Represents the possible providers for a Jira ticket.
 * These can also represent client company names for repository mapping.
 */
export type JiraTicketProvider = string; 

/**
 * Represents the possible branches for a Jira ticket.
 */
export type JiraTicketBranch = 'DEV' | 'QA' | 'PROD';

/**
 * Represents the possible priorities for a Jira ticket.
 */
export type JiraTicketPriority = 'Alta' | 'Media' | 'Baja';

/**
 * Represents an entry in the Jira ticket's history.
 */
export interface JiraTicketHistoryEntry {
  id: string;
  timestamp: string;
  userId: string; 
  action: string; 
  fromStatus?: JiraTicketStatus;
  toStatus?: JiraTicketStatus;
  fromPriority?: JiraTicketPriority; // Added for priority change logging
  toPriority?: JiraTicketPriority;   // Added for priority change logging
  comment?: string;
  commitSha?: string; 
  deploymentId?: string; 
  details?: string; 
  fileName?: string; 
  restoredVersionId?: string; 
  attachedFileNames?: string[]; // For attachment history
}

/**
 * Represents a Jira ticket.
 */
export interface JiraTicket {
  id: string;
  title: string;
  description: string;
  status: JiraTicketStatus;
  assigneeId?: string;
  lastUpdated?: string;
  provider?: JiraTicketProvider;
  branch?: JiraTicketBranch;
  attachmentNames?: string[];
  priority: JiraTicketPriority;
  requestingUserId: string; 
  gitlabRepository?: string;
  history: JiraTicketHistoryEntry[];
}

// Mock data store - initialize once
let mockJiraTickets: JiraTicket[] = [];
let mockJiraTicketsInitialized = false;

function initializeMockJiraTickets() {
    if (mockJiraTicketsInitialized) return;

    mockJiraTickets = [
      {
        id: 'MAX-123',
        title: 'Implement feature X',
        description: 'Details about feature X implementation, including backend and frontend changes.',
        status: 'En Progreso',
        assigneeId: 'admin', 
        lastUpdated: '2024-07-28T10:00:00Z',
        provider: 'TLA',
        branch: 'DEV',
        priority: 'Media',
        requestingUserId: 'client-tla1', 
        gitlabRepository: 'maximo-tla',
        attachmentNames: ['script_ABC.py', 'config_XYZ.xml'],
        history: [
          { id: 'hist-1', timestamp: '2024-07-28T09:00:00Z', userId: 'client-tla1', action: 'Created', toStatus: 'Abierto', details: 'Ticket Creado' },
          { id: 'hist-2', timestamp: '2024-07-28T10:00:00Z', userId: 'admin', action: 'Status Changed', fromStatus: 'Abierto', toStatus: 'En Progreso', details: 'Estado cambiado a En Progreso' },
          { id: 'hist-comment-1', timestamp: '2024-07-28T10:05:00Z', userId: 'admin', action: 'Comment Added', comment: 'Starting development now. Will update with progress.', details: 'Comment added by admin' },
        ],
      },
      {
        id: 'MAX-456',
        title: 'Fix bug Y in login module',
        description: 'Users are unable to login with valid credentials. Issue seems to be related to token validation.',
        status: 'Resuelto',
        assigneeId: 'admin',
        lastUpdated: '2024-07-27T15:30:00Z',
        provider: 'FEMA',
        branch: 'QA',
        priority: 'Alta',
        requestingUserId: 'client-fema1',
        gitlabRepository: 'maximo-fema',
        attachmentNames: ['debug_log.txt', 'screenshot_error.png'],
        history: [
          { id: 'hist-3', timestamp: '2024-07-27T14:00:00Z', userId: 'client-fema1', action: 'Created', toStatus: 'Abierto', details: 'Ticket Creado' },
          { id: 'hist-4', timestamp: '2024-07-27T15:30:00Z', userId: 'admin', action: 'Status Changed', fromStatus: 'En Progreso', toStatus: 'Resuelto', details: 'Estado cambiado a Resuelto' },
          { id: 'hist-comment-2', timestamp: '2024-07-27T15:35:00Z', userId: 'client-fema1', action: 'Comment Added', comment: 'Thanks for fixing this so quickly!', details: 'Comment added by client-fema1' },
        ],
      },
      {
        id: 'MAX-789',
        title: 'Setup new CI/CD pipeline',
        description: 'Configure Jenkins for automated builds and deployments to staging environment.',
        status: 'Abierto', // Unassigned example
        lastUpdated: '2024-07-29T09:00:00Z',
        provider: 'TLA',
        branch: 'PROD',
        priority: 'Alta',
        requestingUserId: 'client-tla2',
        gitlabRepository: 'maximo-tla',
        attachmentNames: ['requirements_cicd.docx'],
        history: [
          { id: 'hist-5', timestamp: '2024-07-29T09:00:00Z', userId: 'client-tla2', action: 'Created', toStatus: 'Abierto', details: 'Ticket Creado' },
        ],
      },
      {
        id: 'MAX-101',
        title: 'Update documentation for API v2',
        description: 'Review and update all relevant sections of the API documentation to reflect v2 changes.',
        status: 'Pendiente',
        assigneeId: 'admin',
        lastUpdated: '2024-07-25T12:00:00Z',
        priority: 'Baja',
        requestingUserId: 'client-tla1', 
        provider: 'TLA', 
        gitlabRepository: 'maximo-tla',
        history: [
          { id: 'hist-6', timestamp: '2024-07-25T12:00:00Z', userId: 'client-tla1', action: 'Created', toStatus: 'Abierto', details: 'Ticket Creado' },
        ],
      },
      {
        id: 'MAX-202',
        title: 'Perform security audit on user module',
        description: 'Conduct a thorough security audit focusing on authentication and authorization mechanisms.',
        status: 'En espera del visto bueno',
        assigneeId: 'another-admin', 
        lastUpdated: '2024-07-26T11:00:00Z',
        priority: 'Media',
        requestingUserId: 'client-generic1',
        gitlabRepository: 'maximo-generic',
        history: [
            { id: 'hist-7', timestamp: '2024-07-26T10:00:00Z', userId: 'client-generic1', action: 'Created', toStatus: 'Abierto', details: 'Ticket Creado' },
            { id: 'hist-8', timestamp: '2024-07-26T11:00:00Z', userId: 'admin', action: 'Status Changed', fromStatus: 'En Progreso', toStatus: 'En espera del visto bueno', details: 'Estado cambiado a En espera del visto bueno' },
        ],
      },
      {
        id: 'MAX-303',
        title: 'Refactor reporting service',
        description: 'Improve performance and maintainability of the current reporting service.',
        status: 'Cerrado',
        assigneeId: 'admin',
        lastUpdated: '2024-07-20T17:00:00Z',
        priority: 'Baja',
        requestingUserId: 'client-fema1', 
        provider: 'FEMA', 
        gitlabRepository: 'maximo-fema',
        attachmentNames: ['old_report_design.rptdesign', 'new_report_design.rptdesign'],
        history: [
          { id: 'hist-9', timestamp: '2024-07-20T16:00:00Z', userId: 'client-fema1', action: 'Created', toStatus: 'Abierto', details: 'Ticket Creado' },
          { id: 'hist-10', timestamp: '2024-07-20T17:00:00Z', userId: 'admin', action: 'Status Changed', fromStatus: 'Resuelto', toStatus: 'Cerrado', details: 'Ticket cerrado.' },
        ],
      },
    ];
    mockJiraTicketsInitialized = true;
}

initializeMockJiraTickets();


/**
 * Asynchronously retrieves Jira tickets.
 * Optionally filters by requestingUserId.
 * @param requestingUserId If provided, filters tickets by this user ID.
 * @returns A promise that resolves to an array of JiraTicket objects.
 */
export async function getJiraTickets(requestingUserId?: string): Promise<JiraTicket[]> {
  await new Promise(resolve => setTimeout(resolve, 20)); 
  let tickets = JSON.parse(JSON.stringify(mockJiraTickets)); 
  if (requestingUserId) {
    tickets = tickets.filter((ticket: JiraTicket) => ticket.requestingUserId === requestingUserId);
  }
  return tickets.sort((a: JiraTicket, b: JiraTicket) => new Date(b.lastUpdated || b.history[0]?.timestamp || 0).getTime() - new Date(a.lastUpdated || a.history[0]?.timestamp || 0).getTime());
}

/**
 * Asynchronously retrieves a specific Jira ticket by its ID.
 * @param ticketId The ID of the Jira ticket to retrieve.
 * @returns A promise that resolves to a JiraTicket object or null if not found.
 */
export async function getJiraTicket(ticketId: string): Promise<JiraTicket | null> {
  await new Promise(resolve => setTimeout(resolve, 10)); 
  const ticket = mockJiraTickets.find((ticket) => ticket.id === ticketId);
  return ticket ? JSON.parse(JSON.stringify(ticket)) : null;
}

interface TicketUpdatePayload {
    newStatus?: JiraTicketStatus;
    newAssigneeId?: string; // Use string, empty string for unassign
    newPriority?: JiraTicketPriority;
    comment?: string;
}

/**
 * Asynchronously updates a Jira ticket's status, assignee, and/or priority.
 * Adds history entries for the changes.
 * @param ticketId The ID of the ticket to update.
 * @param userIdPerformingAction The ID of the user performing the update.
 * @param updates An object containing the fields to update (newStatus, newAssigneeId, newPriority, comment).
 * @returns A promise that resolves to the updated JiraTicket object or null if not found.
 */
export async function updateJiraTicket(
  ticketId: string,
  userIdPerformingAction: string,
  updates: TicketUpdatePayload
): Promise<JiraTicket | null> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const ticketIndex = mockJiraTickets.findIndex(ticket => ticket.id === ticketId);
  if (ticketIndex === -1) {
    return null;
  }
  
  const currentTicket = mockJiraTickets[ticketIndex];
  const updatedTicketFields: Partial<JiraTicket> = {};
  const historyEntriesToAdd: JiraTicketHistoryEntry[] = [];
  const timestamp = new Date().toISOString();

  // Handle Status Change
  if (updates.newStatus !== undefined && updates.newStatus !== currentTicket.status) {
    updatedTicketFields.status = updates.newStatus;
    const isReopeningFromClient = (currentTicket.status === 'Cerrado' || currentTicket.status === 'Resuelto') && updates.newStatus === 'Reabierto';
    let action = 'Status Changed';
    let details = `Estado cambiado de ${currentTicket.status} a ${updates.newStatus}`;
    if (isReopeningFromClient) {
        action = 'Ticket Reabierto';
        details = `Ticket Reabierto por ${userIdPerformingAction}`;
    }
    historyEntriesToAdd.push({
      id: `hist-status-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
      timestamp,
      userId: userIdPerformingAction,
      action,
      fromStatus: currentTicket.status,
      toStatus: updates.newStatus,
      comment: action === 'Ticket Reabierto' ? updates.comment : undefined, // only add comment here if it's a reopen
      details
    });
  }

  // Handle Assignee Change
  const actualNewAssigneeId = updates.newAssigneeId === "" ? undefined : updates.newAssigneeId;
  if (updates.newAssigneeId !== undefined && actualNewAssigneeId !== currentTicket.assigneeId) { 
    updatedTicketFields.assigneeId = actualNewAssigneeId;
    historyEntriesToAdd.push({
      id: `hist-assignee-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
      timestamp,
      userId: userIdPerformingAction,
      action: 'Assignee Changed',
      details: actualNewAssigneeId ? `Asignado a ${actualNewAssigneeId}` : 'Ticket desasignado',
    });
  }
  
  // Handle Priority Change
  if (updates.newPriority !== undefined && updates.newPriority !== currentTicket.priority) {
    updatedTicketFields.priority = updates.newPriority;
    historyEntriesToAdd.push({
      id: `hist-priority-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
      timestamp,
      userId: userIdPerformingAction,
      action: 'Priority Changed',
      fromPriority: currentTicket.priority,
      toPriority: updates.newPriority,
      details: `Prioridad cambiada de ${currentTicket.priority} a ${updates.newPriority}`
    });
  }

  // Handle general comment if no specific action has taken it
  const isReopenAction = historyEntriesToAdd.some(h => h.action === 'Ticket Reabierto');
  if (updates.comment && !isReopenAction) {
     historyEntriesToAdd.push({
        id: `hist-comment-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
        timestamp,
        userId: userIdPerformingAction,
        action: 'Comment Added',
        comment: updates.comment,
        details: `Comentario agregado por ${userIdPerformingAction}`
      });
  }
  
  if (Object.keys(updatedTicketFields).length > 0 || historyEntriesToAdd.length > 0) {
    updatedTicketFields.lastUpdated = timestamp;
  }

  const updatedTicket = {
    ...currentTicket,
    ...updatedTicketFields,
    history: [...currentTicket.history, ...historyEntriesToAdd], 
  };

  mockJiraTickets[ticketIndex] = updatedTicket;
  return JSON.parse(JSON.stringify(updatedTicket));
}


/**
 * Adds a commit-related history entry to a Jira ticket.
 * @param ticketId The ID of the ticket.
 * @param commitSha SHA of the commit.
 * @param userIdPerformingAction User who triggered the commit.
 * @param commitMessage Message of the commit.
 * @param branch The branch the commit was made to.
 * @returns A promise that resolves to the updated JiraTicket object or null.
 */
export async function addCommitToTicketHistory(
  ticketId: string,
  commitSha: string,
  userIdPerformingAction: string,
  commitMessage: string,
  branch: string
): Promise<JiraTicket | null> {
  await new Promise(resolve => setTimeout(resolve, 20)); 
  const ticketIndex = mockJiraTickets.findIndex(ticket => ticket.id === ticketId);
  if (ticketIndex === -1) return null;

  const historyEntry: JiraTicketHistoryEntry = {
    id: `hist-commit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: userIdPerformingAction,
    action: 'Commit Added',
    commitSha: commitSha,
    details: `Commit ${commitSha.substring(0,7)} a rama '${branch}': ${commitMessage}`,
  };

  mockJiraTickets[ticketIndex].history.push(historyEntry);
  mockJiraTickets[ticketIndex].lastUpdated = new Date().toISOString();
  
  if (['Abierto', 'Pendiente', 'Reabierto'].includes(mockJiraTickets[ticketIndex].status)) {
     const oldStatus = mockJiraTickets[ticketIndex].status;
     mockJiraTickets[ticketIndex].status = 'En Progreso';
     const statusChangeEntry: JiraTicketHistoryEntry = {
        id: `hist-status-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: userIdPerformingAction, 
        action: 'Status Changed',
        fromStatus: oldStatus,
        toStatus: 'En Progreso',
        details: 'Estado cambiado automáticamente a "En Progreso" después del commit.',
     };
     mockJiraTickets[ticketIndex].history.push(statusChangeEntry);
  }

  return JSON.parse(JSON.stringify(mockJiraTickets[ticketIndex]));
}


/**
 * Data required to create a new Jira Ticket.
 */
export interface CreateJiraTicketData {
  title: string;
  description: string;
  priority: JiraTicketPriority;
  requestingUserId: string; 
  provider?: JiraTicketProvider; 
  branch?: JiraTicketBranch;
  attachmentNames?: string[];
  assigneeId?: string; // Made optional, as client tickets are unassigned
}

/**
 * Asynchronously creates a new Jira ticket.
 * GitLab repository is determined by the 'provider' field (client's company or admin selection).
 * Adds an initial history entry.
 * @param ticketData The data for the new ticket.
 * @returns A promise that resolves to the created JiraTicket object.
 */
export async function createJiraTicket(ticketData: CreateJiraTicketData): Promise<JiraTicket> {
  await new Promise(resolve => setTimeout(resolve, 50)); 
  
  const newTicketId = `MAS-${Math.floor(Math.random() * 9000) + 1000}`; 

  let gitlabRepository = 'maximo-generic'; 
  if (ticketData.provider?.toLowerCase() === 'tla') {
    gitlabRepository = 'maximo-tla';
  } else if (ticketData.provider?.toLowerCase() === 'fema') {
    gitlabRepository = 'maximo-fema';
  } else if (ticketData.provider) {
    gitlabRepository = `maximo-${ticketData.provider.toLowerCase().replace(/[^a-z0-9]/gi, '')}`;
  }


  const initialHistoryEntry: JiraTicketHistoryEntry = {
    id: `hist-init-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: ticketData.requestingUserId,
    action: 'Created',
    details: 'Ticket Creado',
    toStatus: 'Abierto', 
  };

  const newTicket: JiraTicket = {
    id: newTicketId,
    title: ticketData.title,
    description: ticketData.description,
    status: 'Abierto', 
    priority: ticketData.priority,
    requestingUserId: ticketData.requestingUserId,
    gitlabRepository: gitlabRepository,
    provider: ticketData.provider,
    branch: ticketData.branch, 
    attachmentNames: ticketData.attachmentNames || [], 
    assigneeId: ticketData.assigneeId, // Will be undefined for client-created tickets
    lastUpdated: new Date().toISOString(),
    history: [initialHistoryEntry],
  };
  
  mockJiraTickets.unshift(newTicket); 
  return JSON.parse(JSON.stringify(newTicket));
}

/**
 * Adds a deployment-related history entry to a Jira ticket.
 * @param ticketId The ID of the ticket.
 * @param deploymentId ID of the deployment log entry.
 * @param userIdPerformingAction User who triggered the deployment.
 * @param environment Deployment environment.
 * @param result Result of the deployment.
 * @returns A promise that resolves to the updated JiraTicket object or null.
 */
export async function addDeploymentToTicketHistory(
  ticketId: string,
  deploymentId: string,
  userIdPerformingAction: string,
  environment: string,
  result: string
): Promise<JiraTicket | null> {
  await new Promise(resolve => setTimeout(resolve, 20)); 
  const ticketIndex = mockJiraTickets.findIndex(ticket => ticket.id === ticketId);
  if (ticketIndex === -1) return null;

  const historyEntry: JiraTicketHistoryEntry = {
    id: `hist-deploy-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: userIdPerformingAction,
    action: 'Deployment Recorded',
    deploymentId: deploymentId,
    details: `Despliegue a ${environment} registrado. Resultado: ${result}.`,
  };

  mockJiraTickets[ticketIndex].history.push(historyEntry);
  mockJiraTickets[ticketIndex].lastUpdated = new Date().toISOString();
  
  return JSON.parse(JSON.stringify(mockJiraTickets[ticketIndex]));
}

// Function to get all history entries from all tickets for audit log
export async function getAllTicketHistories(): Promise<JiraTicketHistoryEntry[]> {
    await new Promise(resolve => setTimeout(resolve, 20)); 
    const allHistories: JiraTicketHistoryEntry[] = [];
    mockJiraTickets.forEach(ticket => {
        ticket.history.forEach(entry => {
            allHistories.push({ ...entry, ticketId: ticket.id } as JiraTicketHistoryEntry & {ticketId: string}); 
        });
    });
    return JSON.parse(JSON.stringify(allHistories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())));
}


/**
 * Adds a file restoration history entry to a Jira ticket.
 * @param ticketId The ID of the ticket.
 * @param userIdPerformingAction User who performed the restoration.
 * @param fileName Name of the file restored.
 * @param restoredVersionId ID of the version restored to.
 * @param commitSha Optional commit SHA of the restored version.
 * @returns A promise that resolves to the updated JiraTicket object or null.
 */
export async function addRestorationToTicketHistory(
  ticketId: string,
  userIdPerformingAction: string,
  fileName: string,
  restoredVersionId: string,
  commitSha?: string,
): Promise<JiraTicket | null> {
  await new Promise(resolve => setTimeout(resolve, 20)); 
  const ticketIndex = mockJiraTickets.findIndex(ticket => ticket.id === ticketId);
  if (ticketIndex === -1) return null;

  let details = `Archivo '${fileName}' restaurado a la versión '${restoredVersionId}'`;
  if (commitSha) {
    details += ` (commit ${commitSha.substring(0, 7)})`;
  }
  details += `.`;

  const historyEntry: JiraTicketHistoryEntry = {
    id: `hist-restore-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: userIdPerformingAction,
    action: 'File Restored',
    fileName: fileName,
    restoredVersionId: restoredVersionId,
    commitSha: commitSha,
    details: details,
  };

  mockJiraTickets[ticketIndex].history.push(historyEntry);
  mockJiraTickets[ticketIndex].lastUpdated = new Date().toISOString();
  
  return JSON.parse(JSON.stringify(mockJiraTickets[ticketIndex]));
}

/**
 * Adds a comment to a Jira ticket's history.
 * @param ticketId The ID of the ticket.
 * @param userIdPerformingAction The ID of the user adding the comment.
 * @param commentText The text of the comment.
 * @returns A promise that resolves to the updated JiraTicket object or null if not found.
 */
export async function addCommentToTicket(
  ticketId: string,
  userIdPerformingAction: string,
  commentText: string
): Promise<JiraTicket | null> {
  await new Promise(resolve => setTimeout(resolve, 20)); 
  const ticketIndex = mockJiraTickets.findIndex(ticket => ticket.id === ticketId);
  if (ticketIndex === -1) return null;

  const historyEntry: JiraTicketHistoryEntry = {
    id: `hist-comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    userId: userIdPerformingAction,
    action: 'Comment Added',
    comment: commentText,
    details: `Comentario agregado por ${userIdPerformingAction}`,
  };

  mockJiraTickets[ticketIndex].history.push(historyEntry);
  mockJiraTickets[ticketIndex].lastUpdated = new Date().toISOString();

  return JSON.parse(JSON.stringify(mockJiraTickets[ticketIndex]));
}

/**
 * Adds attachments to a Jira ticket and creates a history entry.
 * @param ticketId The ID of the ticket.
 * @param userIdPerformingAction The ID of the user adding the attachments.
 * @param attachmentNames An array of names for the files being attached.
 * @returns A promise that resolves to the updated JiraTicket object or null if not found.
 */
export async function addAttachmentsToJiraTicket(
  ticketId: string,
  userIdPerformingAction: string,
  attachmentNames: string[]
): Promise<JiraTicket | null> {
  await new Promise(resolve => setTimeout(resolve, 20));
  const ticketIndex = mockJiraTickets.findIndex(ticket => ticket.id === ticketId);
  if (ticketIndex === -1) return null;

  const currentTicket = mockJiraTickets[ticketIndex];
  
  // Update attachmentNames on the ticket
  const newAttachmentNames = [...(currentTicket.attachmentNames || []), ...attachmentNames];
  // Deduplicate names just in case
  currentTicket.attachmentNames = Array.from(new Set(newAttachmentNames));

  // Create history entry
  const historyEntry: JiraTicketHistoryEntry = {
    id: `hist-attach-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    userId: userIdPerformingAction,
    action: 'Attachments Added',
    attachedFileNames: attachmentNames, // Store names of files added in this action
    details: `Archivos adjuntados: ${attachmentNames.join(', ')} por ${userIdPerformingAction}`,
  };

  currentTicket.history.push(historyEntry);
  currentTicket.lastUpdated = new Date().toISOString();

  mockJiraTickets[ticketIndex] = currentTicket;
  return JSON.parse(JSON.stringify(currentTicket));
}
