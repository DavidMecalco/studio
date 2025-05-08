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
  ticketId?: string; // Added ticketId to link history directly to a ticket
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
  ticketsCollectionRef = collection(db, 'tickets');
}

const MOCK_TICKETS_SEEDED_FLAG_V6 = 'mock_tickets_seeded_v6';
const LOCAL_STORAGE_TICKETS_KEY = 'firestore_mock_tickets_cache_v6';

const ticketsToSeed: Ticket[] = [
    {
        id: 'MAS-001',
        title: 'Implement local feature X',
        description: 'Details about local feature X implementation.',
        status: 'En Progreso',
        type: 'Nueva Funcionalidad',
        assigneeId: 'admin',
        lastUpdated: '2024-07-28T10:00:00Z',
        provider: 'TLA',
        branch: 'DEV',
        priority: 'Media',
        requestingUserId: 'client-tla1',
        githubRepository: 'maximo-tla',
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
        githubRepository: 'maximo-fema',
        attachmentNames: ['debug_log.txt', 'screenshot_error.png'],
        history: [
          { id: 'hist-3', timestamp: '2024-07-27T14:00:00Z', userId: 'client-fema1', action: 'Created', toStatus: 'Abierto', toType: 'Bug', details: 'Ticket Creado' },
          { id: 'hist-4', timestamp: '2024-07-27T15:30:00Z', userId: 'admin', action: 'Status Changed', fromStatus: 'En Progreso', toStatus: 'Resuelto', details: 'Estado cambiado a Resuelto' },
        ],
      },
      {
        id: 'MAS-003',
        title: 'Setup new local environment',
        description: 'Configure local environment for testing.',
        status: 'Abierto',
        type: 'Tarea',
        lastUpdated: '2024-07-29T09:00:00Z',
        provider: 'System Corp',
        priority: 'Media',
        requestingUserId: 'superuser',
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
      console.log(`Fetching Tickets from Firestore${requestingUserId ? ` for user ${requestingUserId}` : ''}.`);
      let q;
      if (requestingUserId) {
        q = query(ticketsCollectionRef, where("requestingUserId", "==", requestingUserId), orderBy("lastUpdated", "desc"));
      } else {
        q = query(ticketsCollectionRef, orderBy("lastUpdated", "desc"));
      }
      const querySnapshot = await getDocs(q);
      const tickets: Ticket[] = [];
      querySnapshot.forEach((docSnap) => {
        tickets.push(docSnap.data() as Ticket);
      });
      // Only cache all tickets if not filtering by user
      if (typeof window !== 'undefined' && !requestingUserId) {
        localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
      }
      return tickets;
    } catch (error) {
      console.error(`Error fetching Tickets from Firestore (user: ${requestingUserId || 'all'}), falling back to localStorage if available: `, error);
    }
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
    if (storedTickets) {
      try {
        console.warn(`Fetching Tickets from localStorage (Firestore unavailable or offline)${requestingUserId ? ` for user ${requestingUserId}` : ''}.`);
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
  console.warn(`No Tickets found in Firestore or localStorage${requestingUserId ? ` for user ${requestingUserId}` : ''}.`);
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
  let currentTicket: Ticket | null = null;
  let ticketIndexInLocalStorage = -1;
  let allTicketsFromLocalStorage: Ticket[] = [];

  // Attempt to get current ticket data, preferring Firestore then localStorage
  if (isFirebaseProperlyConfigured && db && ticketsCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      const ticketDocRef = doc(ticketsCollectionRef, ticketId);
      const docSnap = await getDoc(ticketDocRef);
      if (docSnap.exists()) {
        currentTicket = docSnap.data() as Ticket;
      }
    } catch (e) {
      console.error("Error fetching ticket for update from Firestore:", e);
    }
  }

  if (!currentTicket && typeof window !== 'undefined') {
    const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
    if (storedTickets) {
      try {
        allTicketsFromLocalStorage = JSON.parse(storedTickets);
        ticketIndexInLocalStorage = allTicketsFromLocalStorage.findIndex(t => t.id === ticketId);
        if (ticketIndexInLocalStorage > -1) {
          currentTicket = allTicketsFromLocalStorage[ticketIndexInLocalStorage];
        }
      } catch (parseError) {
        console.error("Error parsing tickets from localStorage for update:", parseError);
      }
    }
  }

  if (!currentTicket) {
    console.error(`Cannot update Ticket ${ticketId}: Ticket not found.`);
    return null;
  }

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
  } else {
    console.log(`No effective changes for ticket ${ticketId}.`);
    return currentTicket; 
  }

  const updatedTicketData: Ticket = {
    ...currentTicket,
    ...updatedTicketFields,
    history: [...currentTicket.history, ...historyEntriesToAdd],
  };

  if (isFirebaseProperlyConfigured && db && ticketsCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      const ticketDocRef = doc(ticketsCollectionRef, ticketId);
      await setDoc(ticketDocRef, updatedTicketData);
      console.log(`Ticket ${ticketId} updated in Firestore.`);

      if (typeof window !== 'undefined') {
          let ticketsToCache: Ticket[] = [];
          if (ticketIndexInLocalStorage > -1 && allTicketsFromLocalStorage.length > 0) {
              allTicketsFromLocalStorage[ticketIndexInLocalStorage] = updatedTicketData;
              ticketsToCache = allTicketsFromLocalStorage;
          } else {
              const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
              ticketsToCache = storedTickets ? JSON.parse(storedTickets) : [];
              const idx = ticketsToCache.findIndex(t => t.id === ticketId);
              if (idx > -1) ticketsToCache[idx] = updatedTicketData; else ticketsToCache.push(updatedTicketData);
          }
          localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(ticketsToCache));
      }
      return updatedTicketData;
    } catch (error) {
      console.error(`Error updating Ticket ${ticketId} in Firestore, attempting localStorage only: `, error);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      console.warn(!isFirebaseProperlyConfigured || !db || !ticketsCollectionRef
        ? `Firebase not configured. Updating ticket ${ticketId} in localStorage only.`
        : `Firestore operation failed for ticket ${ticketId} or offline. Updating in localStorage only.`);

      if (ticketIndexInLocalStorage > -1 && allTicketsFromLocalStorage.length > 0) {
        allTicketsFromLocalStorage[ticketIndexInLocalStorage] = updatedTicketData;
        localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(allTicketsFromLocalStorage));
      } else {
        const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
        let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
        const idx = tickets.findIndex(t => t.id === ticketId);
        if (idx > -1) {
            tickets[idx] = updatedTicketData;
        } else {
            console.error(`Ticket ${ticketId} not found in localStorage cache for update after Firestore failure.`);
            return null;
        }
        localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
      }
      console.log(`Ticket ${ticketId} updated in localStorage only.`);
      return updatedTicketData;
    } catch (e) {
      console.error(`Error updating ticket ${ticketId} in localStorage:`, e);
      return null;
    }
  } else {
    console.error(`Cannot update ticket ${ticketId}: Not in browser and Firestore operation failed or unavailable.`);
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
  const newTicketId = `MAS-${Math.floor(Math.random() * 9000) + 1000}`;
  let githubRepository: string | undefined;
  if (ticketData.provider) {
    const organizations = await getOrganizations(); 
    const organization = organizations.find(org => org.name === ticketData.provider);
    if (organization && organization.githubRepository) {
      githubRepository = organization.githubRepository;
    } else {
      githubRepository = `maximo-${ticketData.provider.toLowerCase().replace(/[^a-z0-9-]/gi, '')}`;
    }
  }

  const timestamp = new Date().toISOString();
  const initialHistoryEntry: TicketHistoryEntry = {
    id: `hist-init-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
    timestamp, userId: ticketData.requestingUserId,
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

  if (isFirebaseProperlyConfigured && db && ticketsCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
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
      console.error("Error creating Ticket in Firestore, attempting localStorage only: ", error);
      // Fall through to localStorage logic if Firestore fails
    }
  }

  // This block will execute if:
  // 1. Firebase is not configured OR
  // 2. We are on the client-side and Firestore operations failed (or offline) OR
  // 3. We are on the server-side and Firebase is not configured (no localStorage here).
  if (typeof window !== 'undefined') { // Client-side or Firebase failed/offline
    try {
      console.warn(
        !isFirebaseProperlyConfigured || !db || !ticketsCollectionRef
          ? "Firebase not configured. Creating ticket in localStorage only."
          : "Firestore operation failed or offline. Creating ticket in localStorage only."
      );
      
      const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
      let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
      tickets.unshift(newTicket); // Add to the beginning of the array
      localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
      console.log(`Ticket ${newTicketId} created in localStorage only.`);
      return newTicket;
    } catch (e) {
      console.error("Error creating ticket in localStorage:", e);
      // If localStorage fails, we return null. The action will handle the error message.
      return null; 
    }
  } else { // Server-side
    if (!isFirebaseProperlyConfigured) {
      // If Firebase is not configured and we are on the server,
      // "create" the ticket in-memory for the action to succeed.
      // This won't persist to localStorage from here.
      console.warn(`Firebase not configured. Ticket ${newTicketId} created in-memory (server-side mock). It will not be persisted to localStorage from the server.`);
      return newTicket;
    }
    // If Firebase was configured but failed, and we are on the server (no localStorage access)
    console.error("Cannot create ticket: Not in browser and Firestore operation failed or was unavailable (and Firebase was configured).");
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

    if (result && attachmentNames && attachmentNames.length > 0) {
        const currentTicket = await getTicketById(ticketId); 
        if(currentTicket) {
            const newTicketAttachmentNames = Array.from(new Set([...(currentTicket.attachmentNames || []), ...attachmentNames]));
            
            const attachmentUpdateResult = await updateTicket(ticketId, userIdPerformingAction, {});
            if(attachmentUpdateResult){
                attachmentUpdateResult.attachmentNames = newTicketAttachmentNames; 
                if (isFirebaseProperlyConfigured && db && ticketsCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
                    try {
                        const ticketDocRef = doc(ticketsCollectionRef, ticketId);
                        await setDoc(ticketDocRef, { attachmentNames: newTicketAttachmentNames }, { merge: true });
                         console.log(`Ticket ${ticketId} attachments updated in Firestore (via addCommentToTicket).`);
                    } catch (err) {console.error("Error updating attachments in Firestore via addCommentToTicket",err); }
                }
                if(typeof window !== 'undefined'){
                    const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
                    let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
                    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
                    if (ticketIndex > -1) tickets[ticketIndex].attachmentNames = newTicketAttachmentNames;
                    localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
                     console.log(`Ticket ${ticketId} attachments updated in localStorage (via addCommentToTicket).`);
                }
                return attachmentUpdateResult;
            }
        }
    }
    return result;
}


export async function addAttachmentsToTicket( 
  ticketId: string,
  userIdPerformingAction: string,
  attachmentNames: string[]
): Promise<Ticket | null> {
  
  const currentTicket = await getTicketById(ticketId);
  if (!currentTicket) return null;

  const newAttachmentNames = Array.from(new Set([...(currentTicket.attachmentNames || []), ...attachmentNames]));
  
  const historyEntry: TicketHistoryEntry = {
    id: `hist-attach-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    userId: userIdPerformingAction,
    action: 'Attachments Added',
    attachedFileNames: attachmentNames,
    details: `Archivos adjuntados: ${attachmentNames.join(', ')} por ${userIdPerformingAction}`,
  };
  
  const currentHistory = currentTicket.history || [];

  const updatedTicketData: Ticket = {
      ...currentTicket,
      attachmentNames: newAttachmentNames,
      history: [...currentHistory, historyEntry],
      lastUpdated: new Date().toISOString(),
  };

  if (isFirebaseProperlyConfigured && db && ticketsCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      const ticketDocRef = doc(ticketsCollectionRef, ticketId);
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
      console.error("Error adding attachments to Ticket in Firestore, trying localStorage only: ", error);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      console.warn("Updating ticket attachments in localStorage only (Firestore unavailable or failed).");
      const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
      let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
      const ticketIndex = tickets.findIndex(t => t.id === ticketId);
      if (ticketIndex > -1) {
        tickets[ticketIndex] = updatedTicketData;
        localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
        return updatedTicketData;
      } else {
        console.error(`Ticket ${ticketId} not found in localStorage for attachment update.`);
        return null;
      }
    } catch(e){
      console.error("Error updating attachments in localStorage:", e);
      return null;
    }
  }

  console.error("Cannot add attachments: No persistent storage available.");
  return null;
}

