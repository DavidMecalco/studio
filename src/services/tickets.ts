
import { db, isFirebaseProperlyConfigured } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, query, where, writeBatch, type CollectionReference, type DocumentData, orderBy, limit } from 'firebase/firestore';
import { getOrganizations, type Organization } from './users'; // Import Organization type and getter

/**
 * Represents the possible statuses of a Ticket.
 */
export type TicketStatus = 'Abierto' | 'Pendiente' | 'En Progreso' | 'Resuelto' | 'Cerrado' | 'En espera del visto bueno' | 'Reabierto';

/**
 * Represents the client/organization associated with a Ticket.
 */
export type TicketProvider = string;

/**
 * Represents the possible branches for a Ticket.
 */
export type TicketBranch = 'DEV' | 'QA' | 'PROD';

/**
 * Represents the possible priorities for a Ticket.
 */
export type TicketPriority = 'Alta' | 'Media' | 'Baja';

/**
 * Represents the possible types of a Ticket.
 */
export type TicketType = 'Nueva Funcionalidad' | 'Bug' | 'Issue' | 'Tarea' | 'Hotfix';
export const TICKET_TYPES: TicketType[] = ['Nueva Funcionalidad', 'Bug', 'Issue', 'Tarea', 'Hotfix'];


/**
 * Represents an entry in the Ticket's history.
 */
export interface TicketHistoryEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  fromStatus?: TicketStatus;
  toStatus?: TicketStatus;
  fromPriority?: TicketPriority;
  toPriority?: TicketPriority;
  fromType?: TicketType;
  toType?: TicketType;
  comment?: string;
  commitSha?: string;
  deploymentId?: string;
  details?: string;
  fileName?: string;
  restoredVersionId?: string;
  attachedFileNames?: string[];
}

/**
 * Represents a Ticket.
 */
export interface Ticket {
  id: string; // Document ID in Firestore
  title: string;
  description: string;
  status: TicketStatus;
  type: TicketType;
  assigneeId?: string;
  lastUpdated?: string; // ISO string
  provider?: TicketProvider; // Client/Organization name
  branch?: TicketBranch;
  attachmentNames?: string[];
  priority: TicketPriority;
  requestingUserId: string;
  githubRepository?: string; // Associated GitHub repository (e.g., "owner/repo")
  history: TicketHistoryEntry[];
}

let ticketsCollectionRef: CollectionReference<DocumentData> | null = null;
if (isFirebaseProperlyConfigured && db) {
  ticketsCollectionRef = collection(db, 'tickets'); // Changed collection name
}

const MOCK_TICKETS_SEEDED_FLAG_V6 = 'mock_tickets_seeded_v6'; // Updated version
const LOCAL_STORAGE_TICKETS_KEY = 'firestore_mock_tickets_cache_v6'; // Updated version

const ticketsToSeed: Ticket[] = [
    {
        id: 'MAS-001', // Changed ID format
        title: 'Implement local feature X',
        description: 'Details about local feature X implementation.',
        status: 'En Progreso',
        type: 'Nueva Funcionalidad',
        assigneeId: 'admin',
        lastUpdated: '2024-07-28T10:00:00Z',
        provider: 'TLA', // Organization name
        branch: 'DEV',
        priority: 'Media',
        requestingUserId: 'client-tla1',
        githubRepository: 'maximo-tla', // Example repo for TLA
        attachmentNames: ['script_ABC.py', 'config_XYZ.xml'],
        history: [
          { id: 'hist-1', timestamp: '2024-07-28T09:00:00Z', userId: 'client-tla1', action: 'Created', toStatus: 'Abierto', toType: 'Nueva Funcionalidad', details: 'Ticket Creado' },
          { id: 'hist-2', timestamp: '2024-07-28T10:00:00Z', userId: 'admin', action: 'Status Changed', fromStatus: 'Abierto', toStatus: 'En Progreso', details: 'Estado cambiado a En Progreso' },
        ],
      },
      {
        id: 'MAS-002',
        title: 'Fix local bug Y',
        description: 'Users are unable to perform action Y.',
        status: 'Resuelto',
        type: 'Bug',
        assigneeId: 'admin',
        lastUpdated: '2024-07-27T15:30:00Z',
        provider: 'FEMA',
        branch: 'QA',
        priority: 'Alta',
        requestingUserId: 'client-fema1',
        githubRepository: 'maximo-fema', // Example repo for FEMA
        attachmentNames: ['debug_log.txt', 'screenshot_error.png'],
        history: [
          { id: 'hist-3', timestamp: '2024-07-27T14:00:00Z', userId: 'client-fema1', action: 'Created', toStatus: 'Abierto', toType: 'Bug', details: 'Ticket Creado' },
          { id: 'hist-4', timestamp: '2024-07-27T15:30:00Z', userId: 'admin', action: 'Status Changed', fromStatus: 'En Progreso', toStatus: 'Resuelto', details: 'Estado cambiado a Resuelto' },
        ],
      },
      // Add more diverse seed tickets if needed
      {
        id: 'MAS-003',
        title: 'Setup new local environment',
        description: 'Configure local environment for testing.',
        status: 'Abierto',
        type: 'Tarea',
        lastUpdated: '2024-07-29T09:00:00Z',
        provider: 'System Corp', // No specific client, internal task
        priority: 'Media',
        requestingUserId: 'superuser', // Requested by superuser
        history: [
          { id: 'hist-5', timestamp: '2024-07-29T09:00:00Z', userId: 'superuser', action: 'Created', toStatus: 'Abierto', toType: 'Tarea', details: 'Ticket Creado' },
        ],
      },
];

async function ensureTicketsMockDataSeeded(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(MOCK_TICKETS_SEEDED_FLAG_V6) === 'true' && isFirebaseProperlyConfigured && db && ticketsCollectionRef) {
    try {
        const firstTicket = await getDoc(doc(ticketsCollectionRef, ticketsToSeed[0].id));
        if (firstTicket.exists()) return;
    } catch (e) {/* ignore, proceed to seed */}
  }

  console.log("Attempting to seed Tickets mock data (v6)...");
  localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(ticketsToSeed));
  console.log("Tickets mock data (v6) seeded to localStorage.");

  if (isFirebaseProperlyConfigured && db && navigator.onLine && ticketsCollectionRef) {
    try {
      const batch = writeBatch(db);
      let firestoreNeedsSeeding = false;
      const firstTicketSnap = await getDoc(doc(ticketsCollectionRef, ticketsToSeed[0].id));

      if (!firstTicketSnap.exists()) {
        firestoreNeedsSeeding = true;
        console.log("Preparing to seed Tickets to Firestore (v6)...");
        for (const ticketData of ticketsToSeed) {
          batch.set(doc(ticketsCollectionRef, ticketData.id), ticketData);
        }
      }

      if (firestoreNeedsSeeding) {
        await batch.commit();
        console.log("Initial Tickets (v6) committed to Firestore.");
      } else {
        console.log("Firestore already contains key Tickets mock data (v6). Skipping Firestore Tickets seed.");
      }
    } catch (error) {
      console.warn("Error during Firestore Tickets seeding (v6): ", error);
    }
  } else {
    console.log("Skipping Firestore Tickets seeding (v6). Firebase not configured, offline, or collection ref missing.");
  }
  localStorage.setItem(MOCK_TICKETS_SEEDED_FLAG_V6, 'true');
}


export async function getTickets(requestingUserId?: string): Promise<Ticket[]> {
  await ensureTicketsMockDataSeeded();
  await new Promise(resolve => setTimeout(resolve, 20));

  if (isFirebaseProperlyConfigured && db && ticketsCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      console.log("Fetching Tickets from Firestore.");
      let q = query(ticketsCollectionRef, orderBy("lastUpdated", "desc"));
      if (requestingUserId) {
        q = query(ticketsCollectionRef, where("requestingUserId", "==", requestingUserId), orderBy("lastUpdated", "desc"));
      }
      const querySnapshot = await getDocs(q);
      const tickets: Ticket[] = [];
      querySnapshot.forEach((docSnap) => {
        tickets.push(docSnap.data() as Ticket);
      });
      if (typeof window !== 'undefined') {
        if (!requestingUserId) localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
      }
      return tickets;
    } catch (error) {
      console.error("Error fetching Tickets from Firestore, falling back to localStorage if available: ", error);
    }
  }

  if (typeof window !== 'undefined') {
    const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
    if (storedTickets) {
      try {
        console.warn("Fetching Tickets from localStorage (Firestore unavailable or offline).");
        let tickets: Ticket[] = JSON.parse(storedTickets);
        if (requestingUserId) {
          tickets = tickets.filter(ticket => ticket.requestingUserId === requestingUserId);
        }
        return tickets.sort((a, b) => new Date(b.lastUpdated || b.history[0]?.timestamp || 0).getTime() - new Date(a.lastUpdated || a.history[0]?.timestamp || 0).getTime());
      } catch (e) {
        console.error("Error parsing Tickets from localStorage.", e);
        return [];
      }
    }
  }
  console.warn("No Tickets found in Firestore or localStorage.");
  return [];
}


export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  await ensureTicketsMockDataSeeded();
  await new Promise(resolve => setTimeout(resolve, 10));

  if (isFirebaseProperlyConfigured && db && ticketsCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      if (!ticketId) return null;
      const ticketDocRef = doc(ticketsCollectionRef, ticketId);
      const docSnap = await getDoc(ticketDocRef);
      if (docSnap.exists()) {
        const ticketData = docSnap.data() as Ticket;
        if (typeof window !== 'undefined') {
            const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
            let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
            const ticketIndex = tickets.findIndex(t => t.id === ticketId);
            if (ticketIndex > -1) tickets[ticketIndex] = ticketData; else tickets.push(ticketData);
            localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
        }
        return ticketData;
      }
    } catch (error) {
      console.error(`Error fetching Ticket ${ticketId} from Firestore, falling back to localStorage: `, error);
    }
  }

  if (typeof window !== 'undefined') {
    const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
    if (storedTickets) {
      try {
        const tickets: Ticket[] = JSON.parse(storedTickets);
        const ticket = tickets.find((t) => t.id === ticketId);
        if (ticket) {
            console.warn(`Fetching Ticket ${ticketId} from localStorage (Firestore unavailable or offline).`);
            return ticket;
        }
      } catch (e) {
        console.error("Error parsing Tickets from localStorage for getTicketById", e);
      }
    }
  }
  console.warn(`Ticket ${ticketId} not found in Firestore or localStorage.`);
  return null;
}

interface TicketUpdatePayload {
    newStatus?: TicketStatus;
    newAssigneeId?: string;
    newPriority?: TicketPriority;
    newType?: TicketType;
    comment?: string;
}

export async function updateTicket(
  ticketId: string,
  userIdPerformingAction: string,
  updates: TicketUpdatePayload
): Promise<Ticket | null> {
  if (!isFirebaseProperlyConfigured || !db || !ticketsCollectionRef) {
    console.error(`Cannot update Ticket ${ticketId}: Firebase not properly configured or db/ticketsCollectionRef is null.`);
    return null;
  }

  try {
    const ticketDocRef = doc(ticketsCollectionRef, ticketId);
    const docSnap = await getDoc(ticketDocRef);
    if (!docSnap.exists()) return null;

    const currentTicket = docSnap.data() as Ticket;
    const updatedTicketFields: Partial<Ticket> = {};
    const historyEntriesToAdd: TicketHistoryEntry[] = [];
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
    console.log(`Ticket ${ticketId} updated in Firestore.`);

    if (typeof window !== 'undefined') {
        const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
        let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
        const ticketIndex = tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex > -1) tickets[ticketIndex] = updatedTicketData; else tickets.push(updatedTicketData);
        localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
    }

    return updatedTicketData;
  } catch (error) {
    console.error(`Error updating Ticket ${ticketId} in Firestore: `, error);
    return null;
  }
}


export interface CreateTicketData {
  title: string;
  description: string;
  priority: TicketPriority;
  type: TicketType;
  requestingUserId: string;
  provider?: TicketProvider;
  branch?: TicketBranch;
  attachmentNames?: string[];
  assigneeId?: string;
}

export async function createTicket(ticketData: CreateTicketData): Promise<Ticket | null> {
  if (!isFirebaseProperlyConfigured || !db || !ticketsCollectionRef) {
    console.error(`Cannot create Ticket: Firebase not properly configured or db/ticketsCollectionRef is null.`);
    return null;
  }

  try {
    const newTicketId = `MAS-${Math.floor(Math.random() * 9000) + 1000}`;
    let githubRepository: string | undefined;
    if (ticketData.provider) {
      const organizations = await getOrganizations(); // Fetch organizations
      const organization = organizations.find(org => org.name === ticketData.provider);
      if (organization && organization.githubRepository) {
        githubRepository = organization.githubRepository;
      } else {
        githubRepository = `maximo-${ticketData.provider.toLowerCase().replace(/[^a-z0-9]/gi, '')}`;
      }
    }


    const timestamp = new Date().toISOString();
    const initialHistoryEntry: TicketHistoryEntry = {
      id: `hist-init-${Date.now()}`, timestamp, userId: ticketData.requestingUserId,
      action: 'Created', details: 'Ticket Creado',
      toStatus: 'Abierto', toType: ticketData.type,
    };

    const newTicket: Ticket = {
      id: newTicketId, title: ticketData.title, description: ticketData.description,
      status: 'Abierto', type: ticketData.type, priority: ticketData.priority,
      requestingUserId: ticketData.requestingUserId, githubRepository,
      provider: ticketData.provider, branch: ticketData.branch,
      attachmentNames: ticketData.attachmentNames || [],
      assigneeId: ticketData.assigneeId, lastUpdated: timestamp,
      history: [initialHistoryEntry],
    };

    const ticketDocRef = doc(ticketsCollectionRef, newTicketId);
    await setDoc(ticketDocRef, newTicket);
    console.log(`Ticket ${newTicketId} created in Firestore.`);

    if (typeof window !== 'undefined') {
        const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
        let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
        tickets.unshift(newTicket);
        localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
    }
    return newTicket;
  } catch (error) {
    console.error("Error creating Ticket in Firestore: ", error);
    return null;
  }
}

export async function addCommitToTicketHistory(
  ticketId: string, commitSha: string, userIdPerformingAction: string,
  commitMessage: string, branch: string
): Promise<Ticket | null> {
    const currentTicket = await getTicketById(ticketId);
    let newStatus: TicketStatus | undefined = undefined;
    if (currentTicket && ['Abierto', 'Pendiente', 'Reabierto'].includes(currentTicket.status)) {
        newStatus = 'En Progreso';
    }
    return updateTicket(ticketId, userIdPerformingAction, {
        comment: `Commit ${commitSha.substring(0,7)} a rama '${branch}': ${commitMessage}`,
        newStatus: newStatus
    });
}

export async function addDeploymentToTicketHistory(
  ticketId: string, deploymentId: string, userIdPerformingAction: string,
  environment: string, result: string
): Promise<Ticket | null> {
   return updateTicket(ticketId, userIdPerformingAction, {
        comment: `Despliegue ${deploymentId} a ${environment} registrado. Resultado: ${result}.`
   });
}

export async function getAllTicketHistories(): Promise<TicketHistoryEntry[]> {
  await ensureTicketsMockDataSeeded();
  const tickets = await getTickets();
  const allHistories: TicketHistoryEntry[] = [];
  tickets.forEach(ticket => {
      ticket.history.forEach(entry => {
          allHistories.push({ ...entry, ticketId: ticket.id } as TicketHistoryEntry & {ticketId: string});
      });
  });
  return allHistories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function addRestorationToTicketHistory(
  ticketId: string, userIdPerformingAction: string, fileName: string,
  restoredVersionId: string, commitSha?: string,
): Promise<Ticket | null> {
    let details = `Archivo '${fileName}' restaurado a la versión '${restoredVersionId}'`;
    if (commitSha) details += ` (commit ${commitSha.substring(0, 7)})`;
    details += `.`;
    return updateTicket(ticketId, userIdPerformingAction, { comment: details });
}

export async function addCommentToTicket(
  ticketId: string, userIdPerformingAction: string, commentText: string,
  attachmentNames?: string[]
): Promise<Ticket | null> {
    let commentWithAttachments = commentText;
    if (attachmentNames && attachmentNames.length > 0) {
        commentWithAttachments += `\nArchivos adjuntados: ${attachmentNames.join(', ')}`;
    }
    const result = await updateTicket(ticketId, userIdPerformingAction, { comment: commentWithAttachments });

    if (result && attachmentNames && attachmentNames.length > 0 && ticketsCollectionRef && db) {
        try {
            const ticketDocRef = doc(ticketsCollectionRef, ticketId);
            const currentTicketSnap = await getDoc(ticketDocRef);
            if (currentTicketSnap.exists()) {
                const currentTicketData = currentTicketSnap.data() as Ticket;
                const newTicketAttachmentNames = Array.from(new Set([...(currentTicketData.attachmentNames || []), ...attachmentNames]));
                await setDoc(ticketDocRef, { attachmentNames: newTicketAttachmentNames }, { merge: true });
                console.log(`Ticket ${ticketId} attachments updated in Firestore.`);
                result.attachmentNames = newTicketAttachmentNames;
                if (typeof window !== 'undefined') {
                    const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
                    let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
                    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
                    if (ticketIndex > -1) tickets[ticketIndex].attachmentNames = newTicketAttachmentNames;
                    localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
                }
            }
        } catch (attachError) {
            console.error(`Error updating attachments for ticket ${ticketId} in Firestore: `, attachError);
        }
    }
    return result;
}


export async function addAttachmentsToTicket( // Renamed from addAttachmentsToJiraTicket
  ticketId: string,
  userIdPerformingAction: string,
  attachmentNames: string[]
): Promise<Ticket | null> {
  if (!isFirebaseProperlyConfigured || !db || !ticketsCollectionRef) {
    console.error("Cannot add attachments: Firestore not available.");
    return null;
  }
  try {
    const ticketDocRef = doc(ticketsCollectionRef, ticketId);
    const currentTicketSnap = await getDoc(ticketDocRef);
    if (!currentTicketSnap.exists()) return null;

    const currentTicketData = currentTicketSnap.data() as Ticket;
    const newAttachmentNames = Array.from(new Set([...(currentTicketData.attachmentNames || []), ...attachmentNames]));
    
    const historyEntry: TicketHistoryEntry = {
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

    if (typeof window !== 'undefined') {
        const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
        let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
        const ticketIndex = tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex > -1) tickets[ticketIndex] = updatedTicketData; else tickets.push(updatedTicketData);
        localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
    }
    return updatedTicketData;

  } catch (error) {
    console.error("Error adding attachments to Ticket in Firestore: ", error);
    return null;
  }
}
