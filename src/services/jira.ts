/**
 * Represents the possible statuses of a Jira ticket.
 */
export type JiraTicketStatus = 'Abierto' | 'Pendiente' | 'En Progreso' | 'Resuelto' | 'Cerrado' | 'En espera del visto bueno';

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
}

// Mock data store
let mockJiraTickets: JiraTicket[] = [
  {
    id: 'MAX-123',
    title: 'Implement feature X',
    description: 'Details about feature X implementation, including backend and frontend changes.',
    status: 'En Progreso',
    assigneeId: 'user-1',
    lastUpdated: '2024-07-28T10:00:00Z',
  },
  {
    id: 'MAX-456',
    title: 'Fix bug Y in login module',
    description: 'Users are unable to login with valid credentials. Issue seems to be related to token validation.',
    status: 'Resuelto',
    assigneeId: 'user-2',
    lastUpdated: '2024-07-27T15:30:00Z',
  },
  {
    id: 'MAX-789',
    title: 'Setup new CI/CD pipeline',
    description: 'Configure Jenkins for automated builds and deployments to staging environment.',
    status: 'Abierto',
    lastUpdated: '2024-07-29T09:00:00Z',
  },
  {
    id: 'MAX-101',
    title: 'Update documentation for API v2',
    description: 'Review and update all relevant sections of the API documentation to reflect v2 changes.',
    status: 'Pendiente',
    assigneeId: 'user-1',
    lastUpdated: '2024-07-25T12:00:00Z',
  },
  {
    id: 'MAX-202',
    title: 'Perform security audit on user module',
    description: 'Conduct a thorough security audit focusing on authentication and authorization mechanisms.',
    status: 'En espera del visto bueno',
    assigneeId: 'user-3',
    lastUpdated: '2024-07-26T11:00:00Z',
  },
  {
    id: 'MAX-303',
    title: 'Refactor reporting service',
    description: 'Improve performance and maintainability of the current reporting service.',
    status: 'Cerrado',
    assigneeId: 'user-2',
    lastUpdated: '2024-07-20T17:00:00Z',
  },
];

/**
 * Asynchronously retrieves Jira tickets.
 * @returns A promise that resolves to an array of JiraTicket objects.
 */
export async function getJiraTickets(): Promise<JiraTicket[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return JSON.parse(JSON.stringify(mockJiraTickets)); // Return a deep copy
}

/**
 * Asynchronously retrieves a specific Jira ticket by its ID.
 * @param ticketId The ID of the Jira ticket to retrieve.
 * @returns A promise that resolves to a JiraTicket object or null if not found.
 */
export async function getJiraTicket(ticketId: string): Promise<JiraTicket | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  const ticket = mockJiraTickets.find((ticket) => ticket.id === ticketId);
  return ticket ? JSON.parse(JSON.stringify(ticket)) : null;
}

/**
 * Asynchronously updates a Jira ticket's status and assignee.
 * @param ticketId The ID of the ticket to update.
 * @param newStatus The new status for the ticket.
 * @param newAssigneeId The ID of the new assignee (optional).
 * @returns A promise that resolves to the updated JiraTicket object or null if not found.
 */
export async function updateJiraTicket(
  ticketId: string,
  newStatus: JiraTicketStatus,
  newAssigneeId?: string
): Promise<JiraTicket | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  const ticketIndex = mockJiraTickets.findIndex(ticket => ticket.id === ticketId);
  if (ticketIndex === -1) {
    return null;
  }
  
  const updatedTicket = {
    ...mockJiraTickets[ticketIndex],
    status: newStatus,
    assigneeId: newAssigneeId === '' ? undefined : newAssigneeId, // Handle unassigning
    lastUpdated: new Date().toISOString(),
  };
  mockJiraTickets[ticketIndex] = updatedTicket;
  return JSON.parse(JSON.stringify(updatedTicket));
}