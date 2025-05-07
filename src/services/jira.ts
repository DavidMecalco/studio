/**
 * Represents the possible statuses of a Jira ticket.
 */
export type JiraTicketStatus = 'Abierto' | 'Pendiente' | 'En Progreso' | 'Resuelto' | 'Cerrado' | 'En espera del visto bueno';

/**
 * Represents the possible providers for a Jira ticket.
 * These can also represent client company names for repository mapping.
 */
export type JiraTicketProvider = 'TLA' | 'FEMA';

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
  userId: string; // User who performed the action
  action: string; // e.g., "Created", "Status Changed", "Comment Added", "Commit Added", "File Restored"
  fromStatus?: JiraTicketStatus;
  toStatus?: JiraTicketStatus;
  comment?: string;
  commitSha?: string; // Link to associated commit
  deploymentId?: string; // Link to associated deployment
  details?: string; // General details about the action
  fileName?: string; // For file-related actions like restoration
  restoredVersionId?: string; // For file restoration
}

/**
 * Represents a Jira ticket.
 */
export interface JiraTicket {
  /**
   * The ID of the Jira ticket.
   */
  id: string;
  /**
   * The title of the Jira ticket.
   */
  title: string;
  /**
   * The description of the Jira ticket.
   */
  description: string;
  /**
   * The status of the Jira ticket.
   */
  status: JiraTicketStatus;
  /**
   * The ID of the user assigned to the ticket, if any.
   */
  assigneeId?: string;
  /**
   * The date the ticket was last updated.
   */
  lastUpdated?: string;
  /**
   * The provider associated with the ticket (e.g., TLA, FEMA).
   * For client-created tickets, this might reflect their company.
   */
  provider?: JiraTicketProvider;
  /**
   * The branch associated with the ticket (e.g., DEV, QA, PROD).
   */
  branch?: JiraTicketBranch;
  /**
   * Names of attachments for the ticket.
   */
  attachmentNames?: string[];
  /**
   * The priority of the Jira ticket.
   */
  priority: JiraTicketPriority;
  /**
   * The ID (username for mock) of the user who requested/created the ticket.
   */
  requestingUserId: string; 
  /**
   * The GitLab repository associated with the ticket.
   */
  gitlabRepository?: string;
  /**
   * History of changes and actions on the ticket.
   */
  history: JiraTicketHistoryEntry[];
}

// Mock data store
let mockJiraTickets: JiraTicket[] = [
  {
    id: 'MAX-123',
    title: 'Implement feature X',
    description: 'Details about feature X implementation, including backend and frontend changes.',
    status: 'En Progreso',
    assigneeId: 'admin', // Default assignee for an admin/technician user
    lastUpdated: '2024-07-28T10:00:00Z',
    provider: 'TLA',
    branch: 'DEV',
    priority: 'Media',
    requestingUserId: 'client-tla1', 
    gitlabRepository: 'maximo-tla',
    attachmentNames: ['script_ABC.py', 'config_XYZ.xml'],
    history: [
      { id: 'hist-1', timestamp: '2024-07-28T09:00:00Z', userId: 'client-tla1', action: 'Created', details: 'Ticket Creado' },
      { id: 'hist-2', timestamp: '2024-07-28T10:00:00Z', userId: 'admin', action: 'Status Changed', fromStatus: 'Abierto', toStatus: 'En Progreso', details: 'Estado cambiado a En Progreso' },
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
      { id: 'hist-3', timestamp: '2024-07-27T14:00:00Z', userId: 'client-fema1', action: 'Created', details: 'Ticket Creado' },
      { id: 'hist-4', timestamp: '2024-07-27T15:30:00Z', userId: 'admin', action: 'Status Changed', fromStatus: 'En Progreso', toStatus: 'Resuelto', details: 'Estado cambiado a Resuelto' },
    ],
  },
  {
    id: 'MAX-789',
    title: 'Setup new CI/CD pipeline',
    description: 'Configure Jenkins for automated builds and deployments to staging environment.',
    status: 'Abierto',
    lastUpdated: '2024-07-29T09:00:00Z',
    provider: 'TLA',
    branch: 'PROD',
    priority: 'Alta',
    requestingUserId: 'client-tla2',
    gitlabRepository: 'maximo-tla',
    attachmentNames: ['requirements_cicd.docx'],
    history: [
      { id: 'hist-5', timestamp: '2024-07-29T09:00:00Z', userId: 'client-tla2', action: 'Created', details: 'Ticket Creado' },
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
      { id: 'hist-6', timestamp: '2024-07-25T12:00:00Z', userId: 'client-tla1', action: 'Created', details: 'Ticket Creado' },
    ],
  },
  {
    id: 'MAX-202',
    title: 'Perform security audit on user module',
    description: 'Conduct a thorough security audit focusing on authentication and authorization mechanisms.',
    status: 'En espera del visto bueno',
    assigneeId: 'another-admin', // Different admin for variety
    lastUpdated: '2024-07-26T11:00:00Z',
    priority: 'Media',
    requestingUserId: 'client-generic1',
    gitlabRepository: 'maximo-generic',
    history: [
        { id: 'hist-7', timestamp: '2024-07-26T10:00:00Z', userId: 'client-generic1', action: 'Created', details: 'Ticket Creado' },
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
      { id: 'hist-9', timestamp: '2024-07-20T16:00:00Z', userId: 'client-fema1', action: 'Created', details: 'Ticket Creado' },
      { id: 'hist-10', timestamp: '2024-07-20T17:00:00Z', userId: 'admin', action: 'Status Changed', fromStatus: 'Resuelto', toStatus: 'Cerrado', details: 'Ticket cerrado.' },
    ],
  },
];

/**
 * Asynchronously retrieves Jira tickets.
 * Optionally filters by requestingUserId.
 * @param requestingUserId If provided, filters tickets by this user ID.
 * @returns A promise that resolves to an array of JiraTicket objects.
 */
export async function getJiraTickets(requestingUserId?: string): Promise<JiraTicket[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  let tickets = JSON.parse(JSON.stringify(mockJiraTickets)); 
  if (requestingUserId) {
    tickets = tickets.filter((ticket: JiraTicket) => ticket.requestingUserId === requestingUserId);
  }
  return tickets;
}

/**
 * Asynchronously retrieves a specific Jira ticket by its ID.
 * @param ticketId The ID of the Jira ticket to retrieve.
 * @returns A promise that resolves to a JiraTicket object or null if not found.
 */
export async function getJiraTicket(ticketId: string): Promise<JiraTicket | null> {
  await new Promise(resolve => setTimeout(resolve, 200));
  const ticket = mockJiraTickets.find((ticket) => ticket.id === ticketId);
  return ticket ? JSON.parse(JSON.stringify(ticket)) : null;
}

/**
 * Asynchronously updates a Jira ticket's status and/or assignee.
 * Adds a history entry for the change.
 * @param ticketId The ID of the ticket to update.
 * @param newStatus The new status for the ticket. If undefined, status is not changed.
 * @param newAssigneeId The ID of the new assignee. If undefined, assignee is not changed. If an empty string, ticket is unassigned.
 * @param userIdPerformingAction The ID of the user performing the update.
 * @param comment Optional comment for the history entry.
 * @returns A promise that resolves to the updated JiraTicket object or null if not found.
 */
export async function updateJiraTicket(
  ticketId: string,
  newStatus?: JiraTicketStatus,
  newAssigneeId?: string, // undefined means don't change, "" means unassign
  userIdPerformingAction: string = "system", // Default to system if not specified
  comment?: string
): Promise<JiraTicket | null> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const ticketIndex = mockJiraTickets.findIndex(ticket => ticket.id === ticketId);
  if (ticketIndex === -1) {
    return null;
  }
  
  const currentTicket = mockJiraTickets[ticketIndex];
  const updatedTicketDetails: Partial<JiraTicket> = {};
  let historyEntry: JiraTicketHistoryEntry | null = null;

  if (newStatus !== undefined && newStatus !== currentTicket.status) {
    updatedTicketDetails.status = newStatus;
    historyEntry = {
      id: `hist-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: userIdPerformingAction,
      action: 'Status Changed',
      fromStatus: currentTicket.status,
      toStatus: newStatus,
      comment: comment,
      details: `Estado cambiado de ${currentTicket.status} a ${newStatus}`
    };
  }
  
  const actualNewAssigneeId = newAssigneeId === "" ? undefined : newAssigneeId;
  if (newAssigneeId !== undefined && actualNewAssigneeId !== currentTicket.assigneeId) { // Check if assignee actually changes
    updatedTicketDetails.assigneeId = actualNewAssigneeId;
    // Could create another history entry or combine
    const assigneeChangeDetails = actualNewAssigneeId ? `Asignado a ${actualNewAssigneeId}` : 'Ticket desasignado';
    if (historyEntry) {
      historyEntry.details += `; ${assigneeChangeDetails}`;
      if(comment && historyEntry.comment) historyEntry.comment += `; ${comment}`;
      else if (comment) historyEntry.comment = comment;
    } else {
      historyEntry = {
        id: `hist-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: userIdPerformingAction,
        action: 'Assignee Changed',
        comment: comment,
        details: assigneeChangeDetails,
      };
    }
  } else if (comment && !historyEntry) { // If only a comment is provided
     historyEntry = {
        id: `hist-comment-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: userIdPerformingAction,
        action: 'Comment Added',
        comment: comment,
        details: `Comment added by ${userIdPerformingAction}`
      };
  }
  
  // Only update if there are changes
  if (Object.keys(updatedTicketDetails).length > 0 || historyEntry?.action === 'Comment Added') {
    updatedTicketDetails.lastUpdated = new Date().toISOString();
  }


  const updatedTicket = {
    ...currentTicket,
    ...updatedTicketDetails,
    history: [...currentTicket.history], // Copy existing history
  };

  if (historyEntry) {
    updatedTicket.history.push(historyEntry);
  }

  mockJiraTickets[ticketIndex] = updatedTicket;
  return JSON.parse(JSON.stringify(updatedTicket));
}


/**
 * Adds a commit-related history entry to a Jira ticket.
 * @param ticketId The ID of the ticket.
 * @param commitSha SHA of the commit.
 * @param userIdPerformingAction User who triggered the commit.
 * @param commitMessage Message of the commit.
 * @returns A promise that resolves to the updated JiraTicket object or null.
 */
export async function addCommitToTicketHistory(
  ticketId: string,
  commitSha: string,
  userIdPerformingAction: string,
  commitMessage: string,
  branch: string
): Promise<JiraTicket | null> {
  await new Promise(resolve => setTimeout(resolve, 100));
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
  
  // If ticket status was 'Abierto' or 'Pendiente', move to 'En Progreso'
  if (['Abierto', 'Pendiente'].includes(mockJiraTickets[ticketIndex].status)) {
     const oldStatus = mockJiraTickets[ticketIndex].status;
     mockJiraTickets[ticketIndex].status = 'En Progreso';
     const statusChangeEntry: JiraTicketHistoryEntry = {
        id: `hist-status-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: userIdPerformingAction, // or 'system'
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
  assigneeId?: string; 
}

/**
 * Asynchronously creates a new Jira ticket.
 * GitLab repository is determined by the 'provider' field (client's company or admin selection).
 * Adds an initial history entry.
 * @param ticketData The data for the new ticket.
 * @returns A promise that resolves to the created JiraTicket object.
 */
export async function createJiraTicket(ticketData: CreateJiraTicketData): Promise<JiraTicket> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const newTicketId = `MAS-${Math.floor(Math.random() * 9000) + 1000}`; 

  let gitlabRepository = 'maximo-generic'; 
  if (ticketData.provider === 'TLA') {
    gitlabRepository = 'maximo-tla';
  } else if (ticketData.provider === 'FEMA') {
    gitlabRepository = 'maximo-fema';
  }

  const initialHistoryEntry: JiraTicketHistoryEntry = {
    id: `hist-init-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: ticketData.requestingUserId,
    action: 'Created',
    details: 'Ticket Creado',
    toStatus: 'Abierto', // Ticket starts as 'Abierto'
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
    assigneeId: ticketData.assigneeId, // Could be pre-assigned by admin during creation
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
  await new Promise(resolve => setTimeout(resolve, 100));
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
    await new Promise(resolve => setTimeout(resolve, 100));
    const allHistories: JiraTicketHistoryEntry[] = [];
    mockJiraTickets.forEach(ticket => {
        ticket.history.forEach(entry => {
            allHistories.push({ ...entry, ticketId: ticket.id } as JiraTicketHistoryEntry & {ticketId: string}); // Add ticketId for context
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
  await new Promise(resolve => setTimeout(resolve, 100));
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
