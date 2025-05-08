
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
const SERVICE_NAME = 'TicketService';

if (db) { // Only initialize if db is available
  ticketsCollectionRef = collection(db, 'tickets');
   console.log(`[SERVICE_INIT ${SERVICE_NAME}] Collection ref initialized (tickets: ${!!ticketsCollectionRef}) because db is available.`);
} else {
   console.warn(`[SERVICE_INIT ${SERVICE_NAME}] Firestore db instance is null. ticketsCollectionRef not initialized. isFirebaseProperlyConfigured: ${isFirebaseProperlyConfigured}`);
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
          { id: 'hist-1', timestamp: '2024-07-28T09:00:00Z', userId: 'client-tla1', action: 'Created', toStatus: 'Abierto', toType: 'Nueva Funcionalidad', details: 'Ticket Creado', ticketId: 'MAS-001' },
          { id: 'hist-2', timestamp: '2024-07-28T10:00:00Z', userId: 'admin', action: 'Status Changed', fromStatus: 'Abierto', toStatus: 'En Progreso', details: 'Estado cambiado a En Progreso', ticketId: 'MAS-001' },
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
          { id: 'hist-3', timestamp: '2024-07-27T14:00:00Z', userId: 'client-fema1', action: 'Created', toStatus: 'Abierto', toType: 'Bug', details: 'Ticket Creado', ticketId: 'MAS-002' },
          { id: 'hist-4', timestamp: '2024-07-27T15:30:00Z', userId: 'admin', action: 'Status Changed', fromStatus: 'En Progreso', toStatus: 'Resuelto', details: 'Estado cambiado a Resuelto', ticketId: 'MAS-002' },
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
          { id: 'hist-5', timestamp: '2024-07-29T09:00:00Z', userId: 'superuser', action: 'Created', toStatus: 'Abierto', toType: 'Tarea', details: 'Ticket Creado', ticketId: 'MAS-003' },
        ],
      },
];

async function ensureTicketsMockDataSeeded(): Promise<void> {
  if (typeof window === 'undefined') {
    if (!isFirebaseProperlyConfigured) {
        console.warn(`[${SERVICE_NAME}] Mock data seeding (server-side): Firebase not properly configured. Cannot seed to Firestore.`);
    }
    return;
  }

  const isSeededInLocalStorage = localStorage.getItem(MOCK_TICKETS_SEEDED_FLAG_V6) === 'true';

  if (isSeededInLocalStorage && isFirebaseProperlyConfigured && db && ticketsCollectionRef) {
    try {
        const firstTicket = await getDoc(doc(ticketsCollectionRef, ticketsToSeed[0].id));
        if (firstTicket.exists()) {
            // console.log(`[${SERVICE_NAME}] Mock data (v6) already confirmed in Firestore. Skipping further seeding checks.`);
            return;
        }
    } catch (e) {
        console.warn(`[${SERVICE_NAME}] Error checking Firestore seed status (client might be offline or other Firestore issue). Will proceed with localStorage check and potential re-seed to Firestore if online. Error:`, e);
    }
  }

  if (!isSeededInLocalStorage) {
    console.log(`[${SERVICE_NAME}] Attempting to seed Tickets mock data (v6) to localStorage...`);
    localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(ticketsToSeed));
    localStorage.setItem(MOCK_TICKETS_SEEDED_FLAG_V6, 'true');
    console.log(`[${SERVICE_NAME}] Tickets mock data (v6) seeded to localStorage. Seeding flag set.`);
  }
  

  if (isFirebaseProperlyConfigured && db && navigator.onLine && ticketsCollectionRef) {
    try {
      const firstTicketSnap = await getDoc(doc(ticketsCollectionRef, ticketsToSeed[0].id));
      if (!firstTicketSnap.exists()) {
        const batch = writeBatch(db);
        console.log(`[${SERVICE_NAME}] Preparing to seed Tickets to Firestore (v6)...`);
        for (const ticketData of ticketsToSeed) {
          batch.set(doc(ticketsCollectionRef, ticketData.id), ticketData);
        }
        await batch.commit();
        console.log(`[${SERVICE_NAME}] Initial Tickets (v6) committed to Firestore.`);
      } else {
        // console.log(`[${SERVICE_NAME}] Firestore already contains key Tickets mock data (v6). Skipping Firestore Tickets seed.`);
      }
    } catch (error) {
      console.warn(`[${SERVICE_NAME}] Error during Firestore Tickets seeding (v6): `, error);
    }
  } else if (typeof window !== 'undefined'){
    let reason = "";
    if (!isFirebaseProperlyConfigured) reason += "Firebase not properly configured. ";
    else if (!db) reason += "Firestore db instance is null. ";
    else if (!ticketsCollectionRef) reason += "ticketsCollectionRef is null. ";
    else if (!navigator.onLine) reason += "Client is offline. ";
    // console.log(`[${SERVICE_NAME}] Skipping Firestore Tickets seeding (v6). ${reason}Will rely on localStorage if already seeded there.`);
  }
}


export async function getTickets(requestingUserId?: string): Promise<Ticket[]> {
  await ensureTicketsMockDataSeeded();

  if (isFirebaseProperlyConfigured && db && ticketsCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      // console.log(`[${SERVICE_NAME}] Fetching Tickets from Firestore${requestingUserId ? ` for user ${requestingUserId}` : ''}.`);
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
      if (typeof window !== 'undefined') { 
        localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(
            requestingUserId ? 
            (JSON.parse(localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY) || '[]') as Ticket[]).filter(t => t.requestingUserId !== requestingUserId).concat(tickets)
            : tickets
        ));
      }
      return tickets;
    } catch (error) {
      console.error(`[${SERVICE_NAME}] Error fetching Tickets from Firestore (user: ${requestingUserId || 'all'}). Falling back to localStorage (client-side). Error:`, error);
    }
  }

  if (typeof window !== 'undefined') {
    const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
    if (storedTickets) {
      try {
        console.warn(`[${SERVICE_NAME}] Fetching Tickets from localStorage (Firestore unavailable or offline)${requestingUserId ? ` for user ${requestingUserId}` : ''}.`);
        let tickets: Ticket[] = JSON.parse(storedTickets);
        if (requestingUserId) {
          tickets = tickets.filter(ticket => ticket.requestingUserId === requestingUserId);
        }
        return tickets.sort((a, b) => new Date(b.lastUpdated || b.history[0]?.timestamp || 0).getTime() - new Date(a.lastUpdated || a.history[0]?.timestamp || 0).getTime());
      } catch (e) {
        console.error(`[${SERVICE_NAME}] Error parsing Tickets from localStorage. Error:`, e);
      }
    }
    console.warn(`[${SERVICE_NAME}] No Tickets found in localStorage cache for user ${requestingUserId || 'all'}.`);
    return [];
  }
  console.warn(`[${SERVICE_NAME}] No Tickets found. (Server-side context and Firestore is unavailable/not configured for user ${requestingUserId || 'all'}).`);
  return [];
}


export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  await ensureTicketsMockDataSeeded();

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
      console.error(`[${SERVICE_NAME}] Error fetching Ticket ${ticketId} from Firestore. Falling back to localStorage (client-side). Error:`, error);
    }
  }

  if (typeof window !== 'undefined') {
    const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
    if (storedTickets) {
      try {
        const tickets: Ticket[] = JSON.parse(storedTickets);
        const ticket = tickets.find((t) => t.id === ticketId);
        if (ticket) {
            console.warn(`[${SERVICE_NAME}] Fetching Ticket ${ticketId} from localStorage (Firestore unavailable or offline).`);
            return ticket;
        }
      } catch (e) {
        console.error(`[${SERVICE_NAME}] Error parsing Tickets from localStorage for getTicketById. Error:`, e);
      }
    }
    //  console.warn(`[${SERVICE_NAME}] Ticket ${ticketId} not found in localStorage cache.`);
    return null;
  }
  console.warn(`[${SERVICE_NAME}] Ticket ${ticketId} not found. (Server-side context and Firestore is unavailable/not configured).`);
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
    console.error(
      `[${SERVICE_NAME}] (updateTicket): Cannot update ticket ${ticketId}. `+
      `isFirebaseProperlyConfigured: ${isFirebaseProperlyConfigured}, db: ${!!db}, ticketsCollectionRef: ${!!ticketsCollectionRef}. ` +
      `Firebase not properly configured, or db/collection instance is null.`
    );
    return null;
  }
  
  let currentTicket: Ticket | null = null;
  try {
    const ticketDocRef = doc(ticketsCollectionRef, ticketId);
    const docSnap = await getDoc(ticketDocRef);
    if (docSnap.exists()) {
        currentTicket = docSnap.data() as Ticket;
    }
  } catch (e) {
      console.error(`[${SERVICE_NAME}] (updateTicket): Error fetching ticket ${ticketId} from Firestore before update:`, e);
      return null; 
  }

  if (!currentTicket) {
    console.error(`[${SERVICE_NAME}] (updateTicket): Ticket ${ticketId} not found in Firestore.`);
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
      details, ticketId
    });
  }

  const actualNewAssigneeId = updates.newAssigneeId === "" ? undefined : updates.newAssigneeId; 
  if (updates.newAssigneeId !== undefined && actualNewAssigneeId !== currentTicket.assigneeId) {
    updatedTicketFields.assigneeId = actualNewAssigneeId;
    historyEntriesToAdd.push({
      id: `hist-assignee-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
      timestamp, userId: userIdPerformingAction, action: 'Assignee Changed',
      details: actualNewAssigneeId ? `Asignado a ${actualNewAssigneeId}` : 'Ticket desasignado', ticketId
    });
  }

  if (updates.newPriority !== undefined && updates.newPriority !== currentTicket.priority) {
    updatedTicketFields.priority = updates.newPriority;
    historyEntriesToAdd.push({
      id: `hist-priority-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
      timestamp, userId: userIdPerformingAction, action: 'Priority Changed',
      fromPriority: currentTicket.priority, toPriority: updates.newPriority,
      details: `Prioridad cambiada de ${currentTicket.priority} a ${updates.newPriority}`, ticketId
    });
  }

  if (updates.newType !== undefined && updates.newType !== currentTicket.type) {
    updatedTicketFields.type = updates.newType;
    historyEntriesToAdd.push({
      id: `hist-type-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
      timestamp, userId: userIdPerformingAction, action: 'Type Changed',
      fromType: currentTicket.type, toType: updates.newType,
      details: `Tipo cambiado de ${currentTicket.type} a ${updates.newType}`, ticketId
    });
  }

  const isReopenAction = historyEntriesToAdd.some(h => h.action === 'Ticket Reabierto');
  if (updates.comment && !isReopenAction) { 
     historyEntriesToAdd.push({
        id: `hist-comment-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
        timestamp, userId: userIdPerformingAction, action: 'Comment Added',
        comment: updates.comment,
        details: `Comentario agregado por ${userIdPerformingAction}`, ticketId
      });
  }


  if (Object.keys(updatedTicketFields).length === 0 && historyEntriesToAdd.length === 0) {
    console.log(`[${SERVICE_NAME}] (updateTicket): No effective changes for ticket ${ticketId}.`);
    return currentTicket; 
  }
  updatedTicketFields.lastUpdated = timestamp;


  const updatedTicketData: Ticket = {
    ...currentTicket,
    ...updatedTicketFields,
    history: [...(currentTicket.history || []), ...historyEntriesToAdd],
  };


  try {
    const ticketDocRef = doc(ticketsCollectionRef, ticketId);
    await setDoc(ticketDocRef, updatedTicketData);
    console.log(`[${SERVICE_NAME}] (updateTicket): Ticket ${ticketId} updated in Firestore.`);
    
    if (typeof window !== 'undefined') {
        const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
        let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
        const ticketIndex = tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex > -1) tickets[ticketIndex] = updatedTicketData; else tickets.push(updatedTicketData);
        localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
        console.log(`[${SERVICE_NAME}] (updateTicket): Local ticket cache updated after Firestore update.`);
    }
    return updatedTicketData;
  } catch (error) {
    console.error(`[${SERVICE_NAME}] (updateTicket): Error updating Ticket ${ticketId} in Firestore: `, error);
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
    console.error(
      `[${SERVICE_NAME}] (createTicket): Cannot create ticket. `+
      `isFirebaseProperlyConfigured: ${isFirebaseProperlyConfigured}, db: ${!!db}, ticketsCollectionRef: ${!!ticketsCollectionRef}. ` +
      `Firebase not properly configured, or db/collection instance is null.`
    );
    return null;
  }
  
  const newTicketId = `MAS-${Math.floor(Math.random() * 9000) + 1000}`;
  let githubRepository: string | undefined;
  
  const organizations = await getOrganizations(); 
  if (ticketData.provider) {
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
    toStatus: 'Abierto', toType: ticketData.type, ticketId: newTicketId
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

  try {
    const ticketDocRef = doc(ticketsCollectionRef, newTicketId);
    await setDoc(ticketDocRef, newTicket);
    console.log(`[${SERVICE_NAME}] (createTicket): Ticket ${newTicketId} created in Firestore.`);

    if (typeof window !== 'undefined') {
        const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
        let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
        tickets.unshift(newTicket);
        localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
        console.log(`[${SERVICE_NAME}] (createTicket): Local ticket cache updated after Firestore create.`);
    }
    return newTicket;
  } catch (error) {
    console.error(`[${SERVICE_NAME}] (createTicket): Error creating Ticket ${newTicketId} in Firestore: `, error);
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
    
    const historyComment = `Commit ${commitSha.substring(0,7)} a rama '${branch}': ${commitMessage}`;
    
    return updateTicket(ticketId, userIdPerformingAction, {
        comment: historyComment, 
        newStatus: newStatus
    });
}

export async function addDeploymentToTicketHistory(
  ticketId: string, deploymentId: string, userIdPerformingAction: string,
  environment: string, result: string
): Promise<Ticket | null> {
   const historyComment = `Despliegue ${deploymentId} a ${environment} registrado. Resultado: ${result}.`;
   return updateTicket(ticketId, userIdPerformingAction, {
        comment: historyComment 
   });
}

export async function getAllTicketHistories(): Promise<TicketHistoryEntry[]> {
  await ensureTicketsMockDataSeeded();
  const tickets = await getTickets(); 
  const allHistories: TicketHistoryEntry[] = [];
  tickets.forEach(ticket => {
      (ticket.history || []).forEach(entry => { 
          allHistories.push({ ...entry, ticketId: ticket.id } as TicketHistoryEntry & {ticketId: string});
      });
  });
  return allHistories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function addRestorationToTicketHistory(
  ticketId: string, userIdPerformingAction: string, fileName: string,
  restoredVersionId: string, commitSha?: string,
): Promise<Ticket | null> {
    if (!isFirebaseProperlyConfigured || !db || !ticketsCollectionRef) {
      console.error(
        `[${SERVICE_NAME}] (addRestorationToTicketHistory): Cannot add restoration history for ticket ${ticketId}. `+
        `isFirebaseProperlyConfigured: ${isFirebaseProperlyConfigured}, db: ${!!db}, ticketsCollectionRef: ${!!ticketsCollectionRef}. ` +
        `Firebase not properly configured, or db/collection instance is null.`
      );
      return null;
    }

    let details = `Archivo '${fileName}' restaurado a la versión '${restoredVersionId}'`;
    if (commitSha) details += ` (commit ${commitSha.substring(0, 7)})`;
    details += `.`;
    
    const historyEntry: TicketHistoryEntry = {
        id: `hist-restore-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
        timestamp: new Date().toISOString(),
        userId: userIdPerformingAction,
        action: 'File Restored',
        fileName: fileName,
        restoredVersionId: restoredVersionId,
        commitSha: commitSha,
        details: details,
        ticketId: ticketId
    };

    const currentTicket = await getTicketById(ticketId);
    if (!currentTicket) {
        console.error(`[${SERVICE_NAME}] (addRestorationToTicketHistory): Ticket ${ticketId} not found.`);
        return null;
    }
    const updatedTicketData = {
        ...currentTicket,
        history: [...(currentTicket.history || []), historyEntry],
        lastUpdated: new Date().toISOString(),
    };

    try {
        await setDoc(doc(ticketsCollectionRef, ticketId), updatedTicketData);
        console.log(`[${SERVICE_NAME}] (addRestorationToTicketHistory): File restoration history added to ticket ${ticketId} in Firestore.`);
        if (typeof window !== 'undefined') {
            const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
            let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
            const ticketIndex = tickets.findIndex(t => t.id === ticketId);
            if (ticketIndex > -1) tickets[ticketIndex] = updatedTicketData; else tickets.push(updatedTicketData);
            localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
        }
        return updatedTicketData;
    } catch (error) {
        console.error(`[${SERVICE_NAME}] (addRestorationToTicketHistory): Error adding file restoration history to ticket ${ticketId} in Firestore:`, error);
        return null;
    }
}

export async function addCommentToTicket(
  ticketId: string, userIdPerformingAction: string, commentText: string,
  attachmentNames?: string[]
): Promise<Ticket | null> {
    if (!isFirebaseProperlyConfigured || !db || !ticketsCollectionRef) {
      console.error(
        `[${SERVICE_NAME}] (addCommentToTicket): Cannot add comment for ticket ${ticketId}. `+
        `isFirebaseProperlyConfigured: ${isFirebaseProperlyConfigured}, db: ${!!db}, ticketsCollectionRef: ${!!ticketsCollectionRef}. ` +
        `Firebase not properly configured, or db/collection instance is null.`
      );
      return null;
    }
    
    const currentTicket = await getTicketById(ticketId); 
    if (!currentTicket) {
      console.error(`[${SERVICE_NAME}] (addCommentToTicket): Ticket ${ticketId} not found.`);
      return null;
    }

    const timestamp = new Date().toISOString();
    const historyEntry: TicketHistoryEntry = {
        id: `hist-comment-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
        timestamp,
        userId: userIdPerformingAction,
        action: 'Comment Added',
        comment: commentText,
        attachedFileNames: attachmentNames && attachmentNames.length > 0 ? attachmentNames : undefined,
        details: `Comentario agregado por ${userIdPerformingAction}${attachmentNames && attachmentNames.length > 0 ? `. Archivos adjuntos: ${attachmentNames.join(', ')}` : ''}`,
        ticketId
    };

    const updatedAttachmentNames = attachmentNames && attachmentNames.length > 0 
        ? Array.from(new Set([...(currentTicket.attachmentNames || []), ...attachmentNames])) 
        : currentTicket.attachmentNames;

    const updatedTicketData: Ticket = {
        ...currentTicket,
        attachmentNames: updatedAttachmentNames,
        history: [...(currentTicket.history || []), historyEntry],
        lastUpdated: timestamp,
    };
    
    try {
        const ticketDocRef = doc(ticketsCollectionRef, ticketId);
        await setDoc(ticketDocRef, updatedTicketData); 
        console.log(`[${SERVICE_NAME}] (addCommentToTicket): Comment added to ticket ${ticketId} and history updated in Firestore.`);
        if (typeof window !== 'undefined') {
            const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
            let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
            const ticketIndex = tickets.findIndex(t => t.id === ticketId);
            if (ticketIndex > -1) tickets[ticketIndex] = updatedTicketData; else tickets.push(updatedTicketData);
            localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
        }
        return updatedTicketData;
    } catch (error) {
        console.error(`[${SERVICE_NAME}] (addCommentToTicket): Error adding comment to ticket ${ticketId} in Firestore:`, error);
        return null;
    }
}


export async function addAttachmentsToTicket( 
  ticketId: string,
  userIdPerformingAction: string,
  attachmentNames: string[]
): Promise<Ticket | null> {
  if (!isFirebaseProperlyConfigured || !db || !ticketsCollectionRef) {
    console.error(
        `[${SERVICE_NAME}] (addAttachmentsToTicket): Cannot add attachments for ticket ${ticketId}. `+
        `isFirebaseProperlyConfigured: ${isFirebaseProperlyConfigured}, db: ${!!db}, ticketsCollectionRef: ${!!ticketsCollectionRef}. ` +
        `Firebase not properly configured, or db/collection instance is null.`
    );
    return null;
  }

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
    ticketId
  };
  
  const currentHistory = currentTicket.history || [];

  const updatedTicketData: Ticket = {
      ...currentTicket,
      attachmentNames: newAttachmentNames,
      history: [...currentHistory, historyEntry],
      lastUpdated: new Date().toISOString(),
  };

  try {
    const ticketDocRef = doc(ticketsCollectionRef, ticketId);
    await setDoc(ticketDocRef, updatedTicketData);
    console.log(`[${SERVICE_NAME}] (addAttachmentsToTicket): Attachments added to ticket ${ticketId} and history updated in Firestore.`);
    if (typeof window !== 'undefined') {
        const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
        let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
        const ticketIndex = tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex > -1) tickets[ticketIndex] = updatedTicketData; else tickets.push(updatedTicketData);
        localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
    }
    return updatedTicketData;
  } catch (error) {
    console.error(`[${SERVICE_NAME}] (addAttachmentsToTicket): Error adding attachments to Ticket in Firestore:`, error);
     return null;
  }
}
