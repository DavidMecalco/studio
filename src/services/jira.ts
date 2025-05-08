
import { db, isFirebaseProperlyConfigured } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, query, where, writeBatch, type CollectionReference, type DocumentData, orderBy, limit } from 'firebase/firestore';

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
 * Represents the possible types of a Jira ticket.
 */
export type JiraTicketType = 'Nueva Funcionalidad' | 'Bug' | 'Issue' | 'Tarea' | 'Hotfix';
export const JIRA_TICKET_TYPES: JiraTicketType[] = ['Nueva Funcionalidad', 'Bug', 'Issue', 'Tarea', 'Hotfix'];


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
  fromPriority?: JiraTicketPriority;
  toPriority?: JiraTicketPriority;
  fromType?: JiraTicketType;
  toType?: JiraTicketType;
  comment?: string;
  commitSha?: string;
  deploymentId?: string;
  details?: string;
  fileName?: string;
  restoredVersionId?: string;
  attachedFileNames?: string[];
}

/**
 * Represents a Jira ticket.
 */
export interface JiraTicket {
  id: string; // Document ID in Firestore
  title: string;
  description: string;
  status: JiraTicketStatus;
  type: JiraTicketType;
  assigneeId?: string;
  lastUpdated?: string; // ISO string
  provider?: JiraTicketProvider;
  branch?: JiraTicketBranch;
  attachmentNames?: string[];
  priority: JiraTicketPriority;
  requestingUserId: string;
  gitlabRepository?: string;
  history: JiraTicketHistoryEntry[];
}

let ticketsCollectionRef: CollectionReference<DocumentData> | null = null;
if (isFirebaseProperlyConfigured && db) {
  ticketsCollectionRef = collection(db, 'jira_tickets');
}

const MOCK_JIRA_SEEDED_FLAG_V5 = 'mock_jira_seeded_v5';
const LOCAL_STORAGE_JIRA_KEY = 'firestore_mock_jira_tickets_cache_v5';

const jiraTicketsToSeed: JiraTicket[] = [
    {
        id: 'MAX-123',
        title: 'Implement feature X',
        description: 'Details about feature X implementation, including backend and frontend changes.',
        status: 'En Progreso',
        type: 'Nueva Funcionalidad',
        assigneeId: 'admin',
        lastUpdated: '2024-07-28T10:00:00Z',
        provider: 'TLA',
        branch: 'DEV',
        priority: 'Media',
        requestingUserId: 'client-tla1',
        gitlabRepository: 'maximo-tla',
        attachmentNames: ['script_ABC.py', 'config_XYZ.xml'],
        history: [
          { id: 'hist-1', timestamp: '2024-07-28T09:00:00Z', userId: 'client-tla1', action: 'Created', toStatus: 'Abierto', toType: 'Nueva Funcionalidad', details: 'Ticket Creado' },
          { id: 'hist-2', timestamp: '2024-07-28T10:00:00Z', userId: 'admin', action: 'Status Changed', fromStatus: 'Abierto', toStatus: 'En Progreso', details: 'Estado cambiado a En Progreso' },
          { id: 'hist-comment-1', timestamp: '2024-07-28T10:05:00Z', userId: 'admin', action: 'Comment Added', comment: 'Starting development now. Will update with progress.', details: 'Comment added by admin' },
        ],
      },
      {
        id: 'MAX-456',
        title: 'Fix bug Y in login module',
        description: 'Users are unable to login with valid credentials. Issue seems to be related to token validation.',
        status: 'Resuelto',
        type: 'Bug',
        assigneeId: 'admin',
        lastUpdated: '2024-07-27T15:30:00Z',
        provider: 'FEMA',
        branch: 'QA',
        priority: 'Alta',
        requestingUserId: 'client-fema1',
        gitlabRepository: 'maximo-fema',
        attachmentNames: ['debug_log.txt', 'screenshot_error.png'],
        history: [
          { id: 'hist-3', timestamp: '2024-07-27T14:00:00Z', userId: 'client-fema1', action: 'Created', toStatus: 'Abierto', toType: 'Bug', details: 'Ticket Creado' },
          { id: 'hist-4', timestamp: '2024-07-27T15:30:00Z', userId: 'admin', action: 'Status Changed', fromStatus: 'En Progreso', toStatus: 'Resuelto', details: 'Estado cambiado a Resuelto' },
          { id: 'hist-comment-2', timestamp: '2024-07-27T15:35:00Z', userId: 'client-fema1', action: 'Comment Added', comment: 'Thanks for fixing this so quickly!', details: 'Comment added by client-fema1' },
        ],
      },
      {
        id: 'MAX-789',
        title: 'Setup new CI/CD pipeline',
        description: 'Configure Jenkins for automated builds and deployments to staging environment.',
        status: 'Abierto',
        type: 'Tarea',
        lastUpdated: '2024-07-29T09:00:00Z',
        provider: 'TLA',
        branch: 'PROD',
        priority: 'Alta',
        requestingUserId: 'client-tla2',
        gitlabRepository: 'maximo-tla',
        attachmentNames: ['requirements_cicd.docx'],
        history: [
          { id: 'hist-5', timestamp: '2024-07-29T09:00:00Z', userId: 'client-tla2', action: 'Created', toStatus: 'Abierto', toType: 'Tarea', details: 'Ticket Creado' },
        ],
      },
      {
        id: 'MAX-101',
        title: 'Update documentation for API v2',
        description: 'Review and update all relevant sections of the API documentation to reflect v2 changes.',
        status: 'Pendiente',
        type: 'Issue',
        assigneeId: 'admin',
        lastUpdated: '2024-07-25T12:00:00Z',
        priority: 'Baja',
        requestingUserId: 'client-tla1',
        provider: 'TLA',
        gitlabRepository: 'maximo-tla',
        history: [
          { id: 'hist-6', timestamp: '2024-07-25T12:00:00Z', userId: 'client-tla1', action: 'Created', toStatus: 'Abierto', toType: 'Issue', details: 'Ticket Creado' },
        ],
      },
      {
        id: 'MAX-202',
        title: 'Perform security audit on user module',
        description: 'Conduct a thorough security audit focusing on authentication and authorization mechanisms.',
        status: 'En espera del visto bueno',
        type: 'Tarea',
        assigneeId: 'another-admin',
        lastUpdated: '2024-07-26T11:00:00Z',
        priority: 'Media',
        requestingUserId: 'client-generic1',
        gitlabRepository: 'maximo-generic',
        history: [
            { id: 'hist-7', timestamp: '2024-07-26T10:00:00Z', userId: 'client-generic1', action: 'Created', toStatus: 'Abierto', toType: 'Tarea', details: 'Ticket Creado' },
            { id: 'hist-8', timestamp: '2024-07-26T11:00:00Z', userId: 'admin', action: 'Status Changed', fromStatus: 'En Progreso', toStatus: 'En espera del visto bueno', details: 'Estado cambiado a En espera del visto bueno' },
        ],
      },
      {
        id: 'MAX-303',
        title: 'Refactor reporting service',
        description: 'Improve performance and maintainability of the current reporting service.',
        status: 'Cerrado',
        type: 'Hotfix',
        assigneeId: 'admin',
        lastUpdated: '2024-07-20T17:00:00Z',
        priority: 'Baja',
        requestingUserId: 'client-fema1',
        provider: 'FEMA',
        gitlabRepository: 'maximo-fema',
        attachmentNames: ['old_report_design.rptdesign', 'new_report_design.rptdesign'],
        history: [
          { id: 'hist-9', timestamp: '2024-07-20T16:00:00Z', userId: 'client-fema1', action: 'Created', toStatus: 'Abierto', toType: 'Hotfix', details: 'Ticket Creado' },
          { id: 'hist-10', timestamp: '2024-07-20T17:00:00Z', userId: 'admin', action: 'Status Changed', fromStatus: 'Resuelto', toStatus: 'Cerrado', details: 'Ticket cerrado.' },
        ],
      },
];

async function ensureJiraMockDataSeeded(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(MOCK_JIRA_SEEDED_FLAG_V5) === 'true' && isFirebaseProperlyConfigured && db && ticketsCollectionRef) {
    try {
        const firstTicket = await getDoc(doc(ticketsCollectionRef, jiraTicketsToSeed[0].id));
        if (firstTicket.exists()) return;
    } catch (e) {/* ignore, proceed to seed */}
  }

  console.log("Attempting to seed Jira mock data (v5)...");
  localStorage.setItem(LOCAL_STORAGE_JIRA_KEY, JSON.stringify(jiraTicketsToSeed));
  console.log("Jira mock data (v5) seeded to localStorage.");

  if (isFirebaseProperlyConfigured && db && navigator.onLine && ticketsCollectionRef) {
    try {
      const batch = writeBatch(db);
      let firestoreNeedsSeeding = false;
      const firstTicketSnap = await getDoc(doc(ticketsCollectionRef, jiraTicketsToSeed[0].id));

      if (!firstTicketSnap.exists()) {
        firestoreNeedsSeeding = true;
        console.log("Preparing to seed Jira tickets to Firestore (v5)...");
        for (const ticketData of jiraTicketsToSeed) {
          batch.set(doc(ticketsCollectionRef, ticketData.id), ticketData);
        }
      }

      if (firestoreNeedsSeeding) {
        await batch.commit();
        console.log("Initial Jira tickets (v5) committed to Firestore.");
      } else {
        console.log("Firestore already contains key Jira mock data (v5). Skipping Firestore Jira seed.");
      }
    } catch (error) {
      console.warn("Error during Firestore Jira seeding (v5): ", error);
    }
  } else {
    console.log("Skipping Firestore Jira seeding (v5). Firebase not configured, offline, or collection ref missing.");
  }
  localStorage.setItem(MOCK_JIRA_SEEDED_FLAG_V5, 'true');
}


export async function getJiraTickets(requestingUserId?: string): Promise<JiraTicket[]> {
  await ensureJiraMockDataSeeded();
  await new Promise(resolve => setTimeout(resolve, 20));

  if (isFirebaseProperlyConfigured && db && ticketsCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      console.log("Fetching Jira tickets from Firestore.");
      let q = query(ticketsCollectionRef, orderBy("lastUpdated", "desc"));
      if (requestingUserId) {
        q = query(ticketsCollectionRef, where("requestingUserId", "==", requestingUserId), orderBy("lastUpdated", "desc"));
      }
      const querySnapshot = await getDocs(q);
      const tickets: JiraTicket[] = [];
      querySnapshot.forEach((docSnap) => {
        tickets.push(docSnap.data() as JiraTicket);
      });
      if (typeof window !== 'undefined') {
        // Update full cache if not filtering, or specific user's cache
        if (!requestingUserId) localStorage.setItem(LOCAL_STORAGE_JIRA_KEY, JSON.stringify(tickets));
      }
      return tickets;
    } catch (error) {
      console.error("Error fetching Jira tickets from Firestore, falling back to localStorage if available: ", error);
    }
  }

  if (typeof window !== 'undefined') {
    const storedTickets = localStorage.getItem(LOCAL_STORAGE_JIRA_KEY);
    if (storedTickets) {
      try {
        console.warn("Fetching Jira tickets from localStorage (Firestore unavailable or offline).");
        let tickets: JiraTicket[] = JSON.parse(storedTickets);
        if (requestingUserId) {
          tickets = tickets.filter(ticket => ticket.requestingUserId === requestingUserId);
        }
        return tickets.sort((a, b) => new Date(b.lastUpdated || b.history[0]?.timestamp || 0).getTime() - new Date(a.lastUpdated || a.history[0]?.timestamp || 0).getTime());
      } catch (e) {
        console.error("Error parsing Jira tickets from localStorage.", e);
        return [];
      }
    }
  }
  console.warn("No Jira tickets found in Firestore or localStorage.");
  return [];
}


export async function getJiraTicket(ticketId: string): Promise<JiraTicket | null> {
  await ensureJiraMockDataSeeded();
  await new Promise(resolve => setTimeout(resolve, 10));

  if (isFirebaseProperlyConfigured && db && ticketsCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      if (!ticketId) return null;
      const ticketDocRef = doc(ticketsCollectionRef, ticketId);
      const docSnap = await getDoc(ticketDocRef);
      if (docSnap.exists()) {
        const ticketData = docSnap.data() as JiraTicket;
         // Update localStorage cache
        if (typeof window !== 'undefined') {
            const storedTickets = localStorage.getItem(LOCAL_STORAGE_JIRA_KEY);
            let tickets: JiraTicket[] = storedTickets ? JSON.parse(storedTickets) : [];
            const ticketIndex = tickets.findIndex(t => t.id === ticketId);
            if (ticketIndex > -1) tickets[ticketIndex] = ticketData; else tickets.push(ticketData);
            localStorage.setItem(LOCAL_STORAGE_JIRA_KEY, JSON.stringify(tickets));
        }
        return ticketData;
      }
    } catch (error) {
      console.error(`Error fetching Jira ticket ${ticketId} from Firestore, falling back to localStorage: `, error);
    }
  }

  if (typeof window !== 'undefined') {
    const storedTickets = localStorage.getItem(LOCAL_STORAGE_JIRA_KEY);
    if (storedTickets) {
      try {
        const tickets: JiraTicket[] = JSON.parse(storedTickets);
        const ticket = tickets.find((t) => t.id === ticketId);
        if (ticket) {
            console.warn(`Fetching Jira ticket ${ticketId} from localStorage (Firestore unavailable or offline).`);
            return ticket;
        }
      } catch (e) {
        console.error("Error parsing Jira tickets from localStorage for getJiraTicket", e);
      }
    }
  }
  console.warn(`Jira ticket ${ticketId} not found in Firestore or localStorage.`);
  return null;
}

interface TicketUpdatePayload {
    newStatus?: JiraTicketStatus;
    newAssigneeId?: string;
    newPriority?: JiraTicketPriority;
    newType?: JiraTicketType;
    comment?: string;
}

export async function updateJiraTicket(
  ticketId: string,
  userIdPerformingAction: string,
  updates: TicketUpdatePayload
): Promise<JiraTicket | null> {
  if (!isFirebaseProperlyConfigured || !db || !ticketsCollectionRef) {
    console.error(`Cannot update Jira ticket ${ticketId}: Firebase not properly configured or db/ticketsCollectionRef is null.`);
    // Optionally implement localStorage only update for offline, but this can lead to data divergence.
    // For a "backend" implementation, failing here if Firestore is unavailable is more correct.
    return null;
  }

  try {
    const ticketDocRef = doc(ticketsCollectionRef, ticketId);
    const docSnap = await getDoc(ticketDocRef);
    if (!docSnap.exists()) return null;

    const currentTicket = docSnap.data() as JiraTicket;
    const updatedTicketFields: Partial<JiraTicket> = {};
    const historyEntriesToAdd: JiraTicketHistoryEntry[] = [];
    const timestamp = new Date().toISOString();

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
        timestamp, userId: userIdPerformingAction, action,
        fromStatus: currentTicket.status, toStatus: updates.newStatus,
        comment: action === 'Ticket Reabierto' ? updates.comment : undefined,
        details
      });
    }

    const actualNewAssigneeId = updates.newAssigneeId === "" ? undefined : updates.newAssigneeId;
    if (updates.newAssigneeId !== undefined && actualNewAssigneeId !== currentTicket.assigneeId) {
      updatedTicketFields.assigneeId = actualNewAssigneeId;
      historyEntriesToAdd.push({
        id: `hist-assignee-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
        timestamp, userId: userIdPerformingAction, action: 'Assignee Changed',
        details: actualNewAssigneeId ? `Asignado a ${actualNewAssigneeId}` : 'Ticket desasignado',
      });
    }

    if (updates.newPriority !== undefined && updates.newPriority !== currentTicket.priority) {
      updatedTicketFields.priority = updates.newPriority;
      historyEntriesToAdd.push({
        id: `hist-priority-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
        timestamp, userId: userIdPerformingAction, action: 'Priority Changed',
        fromPriority: currentTicket.priority, toPriority: updates.newPriority,
        details: `Prioridad cambiada de ${currentTicket.priority} a ${updates.newPriority}`
      });
    }

    if (updates.newType !== undefined && updates.newType !== currentTicket.type) {
      updatedTicketFields.type = updates.newType;
      historyEntriesToAdd.push({
        id: `hist-type-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
        timestamp, userId: userIdPerformingAction, action: 'Type Changed',
        fromType: currentTicket.type, toType: updates.newType,
        details: `Tipo cambiado de ${currentTicket.type} a ${updates.newType}`
      });
    }

    const isReopenAction = historyEntriesToAdd.some(h => h.action === 'Ticket Reabierto');
    if (updates.comment && !isReopenAction) {
       historyEntriesToAdd.push({
          id: `hist-comment-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
          timestamp, userId: userIdPerformingAction, action: 'Comment Added',
          comment: updates.comment,
          details: `Comentario agregado por ${userIdPerformingAction}`
        });
    }

    if (Object.keys(updatedTicketFields).length > 0 || historyEntriesToAdd.length > 0) {
      updatedTicketFields.lastUpdated = timestamp;
    }

    const updatedTicketData = {
      ...currentTicket,
      ...updatedTicketFields,
      history: [...currentTicket.history, ...historyEntriesToAdd],
    };

    await setDoc(ticketDocRef, updatedTicketData);
    console.log(`Jira ticket ${ticketId} updated in Firestore.`);

    // Update localStorage cache
    if (typeof window !== 'undefined') {
        const storedTickets = localStorage.getItem(LOCAL_STORAGE_JIRA_KEY);
        let tickets: JiraTicket[] = storedTickets ? JSON.parse(storedTickets) : [];
        const ticketIndex = tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex > -1) tickets[ticketIndex] = updatedTicketData; else tickets.push(updatedTicketData);
        localStorage.setItem(LOCAL_STORAGE_JIRA_KEY, JSON.stringify(tickets));
    }

    return updatedTicketData;
  } catch (error) {
    console.error(`Error updating Jira ticket ${ticketId} in Firestore: `, error);
    return null;
  }
}


export interface CreateJiraTicketData {
  title: string;
  description: string;
  priority: JiraTicketPriority;
  type: JiraTicketType;
  requestingUserId: string;
  provider?: JiraTicketProvider;
  branch?: JiraTicketBranch;
  attachmentNames?: string[];
  assigneeId?: string;
}

export async function createJiraTicket(ticketData: CreateJiraTicketData): Promise<JiraTicket | null> {
  if (!isFirebaseProperlyConfigured || !db || !ticketsCollectionRef) {
    console.error(`Cannot create Jira ticket: Firebase not properly configured or db/ticketsCollectionRef is null.`);
    return null;
  }

  try {
    const newTicketId = `MAS-${Math.floor(Math.random() * 9000) + 1000}`;
    let gitlabRepository = 'maximo-generic';
    if (ticketData.provider?.toLowerCase() === 'tla') gitlabRepository = 'maximo-tla';
    else if (ticketData.provider?.toLowerCase() === 'fema') gitlabRepository = 'maximo-fema';
    else if (ticketData.provider) gitlabRepository = `maximo-${ticketData.provider.toLowerCase().replace(/[^a-z0-9]/gi, '')}`;

    const timestamp = new Date().toISOString();
    const initialHistoryEntry: JiraTicketHistoryEntry = {
      id: `hist-init-${Date.now()}`, timestamp, userId: ticketData.requestingUserId,
      action: 'Created', details: 'Ticket Creado',
      toStatus: 'Abierto', toType: ticketData.type,
    };

    const newTicket: JiraTicket = {
      id: newTicketId, title: ticketData.title, description: ticketData.description,
      status: 'Abierto', type: ticketData.type, priority: ticketData.priority,
      requestingUserId: ticketData.requestingUserId, gitlabRepository,
      provider: ticketData.provider, branch: ticketData.branch,
      attachmentNames: ticketData.attachmentNames || [],
      assigneeId: ticketData.assigneeId, lastUpdated: timestamp,
      history: [initialHistoryEntry],
    };

    const ticketDocRef = doc(ticketsCollectionRef, newTicketId);
    await setDoc(ticketDocRef, newTicket);
    console.log(`Jira ticket ${newTicketId} created in Firestore.`);

    // Update localStorage cache
    if (typeof window !== 'undefined') {
        const storedTickets = localStorage.getItem(LOCAL_STORAGE_JIRA_KEY);
        let tickets: JiraTicket[] = storedTickets ? JSON.parse(storedTickets) : [];
        tickets.unshift(newTicket); // Add to beginning for recency
        localStorage.setItem(LOCAL_STORAGE_JIRA_KEY, JSON.stringify(tickets));
    }
    return newTicket;
  } catch (error) {
    console.error("Error creating Jira ticket in Firestore: ", error);
    return null;
  }
}

export async function addCommitToTicketHistory(
  ticketId: string, commitSha: string, userIdPerformingAction: string,
  commitMessage: string, branch: string
): Promise<JiraTicket | null> {
    return updateJiraTicket(ticketId, userIdPerformingAction, {
        comment: `Commit ${commitSha.substring(0,7)} a rama '${branch}': ${commitMessage}`,
        // If status is Abierto, Pendiente or Reabierto, move to En Progreso.
        // This logic is simplified here, the updateJiraTicket function's history generation needs to be robust
        newStatus: ['Abierto', 'Pendiente', 'Reabierto'].includes((await getJiraTicket(ticketId))?.status || '') ? 'En Progreso' : undefined
    });
}

export async function addDeploymentToTicketHistory(
  ticketId: string, deploymentId: string, userIdPerformingAction: string,
  environment: string, result: string
): Promise<JiraTicket | null> {
   return updateJiraTicket(ticketId, userIdPerformingAction, {
        comment: `Despliegue ${deploymentId} a ${environment} registrado. Resultado: ${result}.`
   });
}

export async function getAllTicketHistories(): Promise<JiraTicketHistoryEntry[]> {
  await ensureJiraMockDataSeeded();
  const tickets = await getJiraTickets(); // This will use Firestore if available, else localStorage
  const allHistories: JiraTicketHistoryEntry[] = [];
  tickets.forEach(ticket => {
      ticket.history.forEach(entry => {
          allHistories.push({ ...entry, ticketId: ticket.id } as JiraTicketHistoryEntry & {ticketId: string});
      });
  });
  return allHistories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function addRestorationToTicketHistory(
  ticketId: string, userIdPerformingAction: string, fileName: string,
  restoredVersionId: string, commitSha?: string,
): Promise<JiraTicket | null> {
    let details = `Archivo '${fileName}' restaurado a la versión '${restoredVersionId}'`;
    if (commitSha) details += ` (commit ${commitSha.substring(0, 7)})`;
    details += `.`;
    return updateJiraTicket(ticketId, userIdPerformingAction, { comment: details });
}

export async function addCommentToTicket(
  ticketId: string, userIdPerformingAction: string, commentText: string,
  attachmentNames?: string[]
): Promise<JiraTicket | null> {
    let commentWithAttachments = commentText;
    if (attachmentNames && attachmentNames.length > 0) {
        commentWithAttachments += `\nArchivos adjuntos: ${attachmentNames.join(', ')}`;
    }
    // The updateJiraTicket function will create the history entry.
    // If attachments are involved, the updateJiraTicket function would also need to update the ticket's main attachment list.
    // This needs a more specific update path in updateJiraTicket or a dedicated service function.
    // For now, just passing the comment.
    const result = await updateJiraTicket(ticketId, userIdPerformingAction, { comment: commentWithAttachments });

    // If successful and attachments were provided, separately update the ticket's attachment list.
    // This is a bit clunky and ideally part of a single transactional update.
    if (result && attachmentNames && attachmentNames.length > 0 && ticketsCollectionRef && db) {
        try {
            const ticketDocRef = doc(ticketsCollectionRef, ticketId);
            const currentTicketSnap = await getDoc(ticketDocRef);
            if (currentTicketSnap.exists()) {
                const currentTicketData = currentTicketSnap.data() as JiraTicket;
                const newTicketAttachmentNames = Array.from(new Set([...(currentTicketData.attachmentNames || []), ...attachmentNames]));
                await setDoc(ticketDocRef, { attachmentNames: newTicketAttachmentNames }, { merge: true });
                console.log(`Ticket ${ticketId} attachments updated in Firestore.`);
                result.attachmentNames = newTicketAttachmentNames; // Update the returned object
                 // Update localStorage cache for attachments specifically
                if (typeof window !== 'undefined') {
                    const storedTickets = localStorage.getItem(LOCAL_STORAGE_JIRA_KEY);
                    let tickets: JiraTicket[] = storedTickets ? JSON.parse(storedTickets) : [];
                    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
                    if (ticketIndex > -1) tickets[ticketIndex].attachmentNames = newTicketAttachmentNames;
                    localStorage.setItem(LOCAL_STORAGE_JIRA_KEY, JSON.stringify(tickets));
                }
            }
        } catch (attachError) {
            console.error(`Error updating attachments for ticket ${ticketId} in Firestore: `, attachError);
            // Comment was added, but attachment list update failed.
        }
    }
    return result;
}


export async function addAttachmentsToJiraTicket(
  ticketId: string,
  userIdPerformingAction: string,
  attachmentNames: string[]
): Promise<JiraTicket | null> {
  if (!isFirebaseProperlyConfigured || !db || !ticketsCollectionRef) {
    console.error("Cannot add attachments: Firestore not available.");
    return null;
  }
  try {
    const ticketDocRef = doc(ticketsCollectionRef, ticketId);
    const currentTicketSnap = await getDoc(ticketDocRef);
    if (!currentTicketSnap.exists()) return null;

    const currentTicketData = currentTicketSnap.data() as JiraTicket;
    const newAttachmentNames = Array.from(new Set([...(currentTicketData.attachmentNames || []), ...attachmentNames]));
    
    const historyEntry: JiraTicketHistoryEntry = {
      id: `hist-attach-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      userId: userIdPerformingAction,
      action: 'Attachments Added',
      attachedFileNames: attachmentNames,
      details: `Archivos adjuntados: ${attachmentNames.join(', ')} por ${userIdPerformingAction}`,
    };

    const updatedTicketData = {
        ...currentTicketData,
        attachmentNames: newAttachmentNames,
        history: [...currentTicketData.history, historyEntry],
        lastUpdated: new Date().toISOString(),
    };

    await setDoc(ticketDocRef, updatedTicketData);
    console.log(`Attachments added to ticket ${ticketId} and history updated in Firestore.`);

    // Update localStorage cache
    if (typeof window !== 'undefined') {
        const storedTickets = localStorage.getItem(LOCAL_STORAGE_JIRA_KEY);
        let tickets: JiraTicket[] = storedTickets ? JSON.parse(storedTickets) : [];
        const ticketIndex = tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex > -1) tickets[ticketIndex] = updatedTicketData; else tickets.push(updatedTicketData);
        localStorage.setItem(LOCAL_STORAGE_JIRA_KEY, JSON.stringify(tickets));
    }
    return updatedTicketData;

  } catch (error) {
    console.error("Error adding attachments to Jira ticket in Firestore: ", error);
    return null;
  }
}

    