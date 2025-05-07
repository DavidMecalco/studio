
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
 * @param ticketId The ID of the ticket to update.
 * @param newStatus The new status for the ticket. If undefined, status is not changed.
 * @param newAssigneeId The ID of the new assignee. If undefined, assignee is not changed. If an empty string, ticket is unassigned.
 * @returns A promise that resolves to the updated JiraTicket object or null if not found.
 */
export async function updateJiraTicket(
  ticketId: string,
  newStatus?: JiraTicketStatus,
  newAssigneeId?: string // undefined means don't change, "" means unassign
): Promise<JiraTicket | null> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const ticketIndex = mockJiraTickets.findIndex(ticket => ticket.id === ticketId);
  if (ticketIndex === -1) {
    return null;
  }
  
  const currentTicket = mockJiraTickets[ticketIndex];
  const updatedTicketDetails: Partial<JiraTicket> = {};

  if (newStatus !== undefined) {
    updatedTicketDetails.status = newStatus;
  }
  
  if (newAssigneeId !== undefined) {
    updatedTicketDetails.assigneeId = newAssigneeId === "" ? undefined : newAssigneeId;
  }
  
  // Only update if there are changes
  if (Object.keys(updatedTicketDetails).length > 0) {
    updatedTicketDetails.lastUpdated = new Date().toISOString();
  }

  const updatedTicket = {
    ...currentTicket,
    ...updatedTicketDetails,
  };
  mockJiraTickets[ticketIndex] = updatedTicket;
  return JSON.parse(JSON.stringify(updatedTicket));
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
  };
  
  mockJiraTickets.unshift(newTicket); 
  return JSON.parse(JSON.stringify(newTicket));
}
