
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

const MOCK_TICKETS_SEEDED_FLAG_V7 = 'mock_tickets_seeded_v7'; // Incremented version
const LOCAL_STORAGE_TICKETS_KEY = 'firestore_mock_tickets_cache_v7'; // Incremented version

const getDateDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
};

const ticketsToSeed: Ticket[] = [
    {
        id: 'MAS-001',
        title: 'Implementar dashboard de cliente TLA',
        description: 'Desarrollar un dashboard personalizado para el cliente TLA con KPIs de sus tickets.',
        status: 'En Progreso', type: 'Nueva Funcionalidad', assigneeId: 'admin',
        lastUpdated: getDateDaysAgo(2), provider: 'TLA', branch: 'DEV', priority: 'Media',
        requestingUserId: 'client-tla1', githubRepository: 'maximo-tla',
        attachmentNames: ['requerimientos_dashboard_tla.docx', 'mockup_v1.png'],
        history: [
          { id: 'hist-1-1', timestamp: getDateDaysAgo(5), userId: 'client-tla1', action: 'Created', toStatus: 'Abierto', toType: 'Nueva Funcionalidad', details: 'Ticket Creado por cliente TLA', ticketId: 'MAS-001' },
          { id: 'hist-1-2', timestamp: getDateDaysAgo(4), userId: 'superuser', action: 'Assignee Changed', details: 'Asignado a admin', ticketId: 'MAS-001' },
          { id: 'hist-1-3', timestamp: getDateDaysAgo(2), userId: 'admin', action: 'Status Changed', fromStatus: 'Abierto', toStatus: 'En Progreso', details: 'Inicio de desarrollo', ticketId: 'MAS-001' },
        ],
    },
    {
        id: 'MAS-002',
        title: 'Corregir error de cálculo en reporte FEMA',
        description: 'El reporte de costos para FEMA muestra totales incorrectos en la sección de materiales.',
        status: 'Resuelto', type: 'Bug', assigneeId: 'alice-wonderland',
        lastUpdated: getDateDaysAgo(1), provider: 'FEMA', branch: 'PROD', priority: 'Alta',
        requestingUserId: 'client-fema1', githubRepository: 'maximo-fema',
        attachmentNames: ['reporte_con_error.pdf', 'calculo_correcto.xlsx'],
        history: [
          { id: 'hist-2-1', timestamp: getDateDaysAgo(7), userId: 'client-fema1', action: 'Created', toStatus: 'Abierto', toType: 'Bug', details: 'Reporte de Bug por cliente FEMA', ticketId: 'MAS-002' },
          { id: 'hist-2-2', timestamp: getDateDaysAgo(6), userId: 'superuser', action: 'Assignee Changed', details: 'Asignado a alice-wonderland', ticketId: 'MAS-002' },
          { id: 'hist-2-3', timestamp: getDateDaysAgo(3), userId: 'alice-wonderland', action: 'Status Changed', fromStatus: 'En Progreso', toStatus: 'En espera del visto bueno', details: 'Corrección implementada, pendiente de QA', ticketId: 'MAS-002' },
          { id: 'hist-2-4', timestamp: getDateDaysAgo(1), userId: 'client-fema1', action: 'Status Changed', fromStatus: 'En espera del visto bueno', toStatus: 'Resuelto', details: 'Validado por el cliente', ticketId: 'MAS-002' },
        ],
    },
    {
        id: 'MAS-003',
        title: 'Configurar nuevo ambiente de Staging',
        description: 'Crear y configurar un ambiente de Staging para pruebas pre-productivas.',
        status: 'Abierto', type: 'Tarea', assigneeId: 'dave-grohl',
        lastUpdated: getDateDaysAgo(0), provider: 'System Corp', priority: 'Media',
        requestingUserId: 'superuser',
        history: [
          { id: 'hist-3-1', timestamp: getDateDaysAgo(0), userId: 'superuser', action: 'Created', toStatus: 'Abierto', toType: 'Tarea', details: 'Ticket Creado por superuser', ticketId: 'MAS-003' },
          { id: 'hist-3-2', timestamp: getDateDaysAgo(0), userId: 'superuser', action: 'Assignee Changed', details: 'Asignado a dave-grohl', ticketId: 'MAS-003' },
        ],
    },
    {
        id: 'MAS-004',
        title: 'Hotfix: Falla crítica en API de integración OtherCompany',
        description: 'La API de integración con OtherCompany dejó de responder, afectando la sincronización de datos.',
        status: 'En Progreso', type: 'Hotfix', assigneeId: 'bob-the-builder',
        lastUpdated: getDateDaysAgo(0), provider: 'Other Company', branch: 'PROD', priority: 'Alta',
        requestingUserId: 'client-generic1', githubRepository: 'maximo-generic',
        history: [
            { id: 'hist-4-1', timestamp: getDateDaysAgo(0), userId: 'client-generic1', action: 'Created', toStatus: 'Abierto', toType: 'Hotfix', details: 'Reporte Urgente por Other Company', ticketId: 'MAS-004' },
            { id: 'hist-4-2', timestamp: getDateDaysAgo(0), userId: 'superuser', action: 'Assignee Changed', details: 'Asignado a bob-the-builder', ticketId: 'MAS-004' },
            { id: 'hist-4-3', timestamp: getDateDaysAgo(0), userId: 'bob-the-builder', action: 'Status Changed', fromStatus: 'Abierto', toStatus: 'En Progreso', details: 'Investigación iniciada', ticketId: 'MAS-004' },
        ]
    },
    {
        id: 'MAS-005',
        title: 'Mejora de rendimiento en módulo de reportes GovSector',
        description: 'Optimizar consultas y lógica del módulo de reportes para reducir tiempos de carga.',
        status: 'Pendiente', type: 'Nueva Funcionalidad',
        lastUpdated: getDateDaysAgo(10), provider: 'GovSector', branch: 'DEV', priority: 'Baja',
        requestingUserId: 'client-gov1', githubRepository: 'maximo-gov',
        history: [
            { id: 'hist-5-1', timestamp: getDateDaysAgo(10), userId: 'client-gov1', action: 'Created', toStatus: 'Abierto', toType: 'Nueva Funcionalidad', details: 'Solicitud de mejora por GovSector', ticketId: 'MAS-005' },
            { id: 'hist-5-2', timestamp: getDateDaysAgo(9), userId: 'superuser', action: 'Status Changed', fromStatus: 'Abierto', toStatus: 'Pendiente', details: 'Pendiente de asignación de recursos', ticketId: 'MAS-005' }
        ]
    },
    {
        id: 'MAS-006',
        title: 'Capacitación sobre nuevas funcionalidades para EnergyCorp',
        description: 'Agendar y realizar sesión de capacitación para el equipo de EnergyCorp sobre las últimas actualizaciones del portal.',
        status: 'Cerrado', type: 'Tarea', assigneeId: 'carol-danvers',
        lastUpdated: getDateDaysAgo(15), provider: 'EnergyCorp', priority: 'Media',
        requestingUserId: 'superuser', githubRepository: 'maximo-energy',
        history: [
            { id: 'hist-6-1', timestamp: getDateDaysAgo(20), userId: 'superuser', action: 'Created', toStatus: 'Abierto', toType: 'Tarea', details: 'Creación de tarea de capacitación', ticketId: 'MAS-006' },
            { id: 'hist-6-2', timestamp: getDateDaysAgo(19), userId: 'superuser', action: 'Assignee Changed', details: 'Asignado a carol-danvers', ticketId: 'MAS-006' },
            { id: 'hist-6-3', timestamp: getDateDaysAgo(18), userId: 'carol-danvers', action: 'Status Changed', fromStatus: 'Abierto', toStatus: 'En Progreso', details: 'Preparando material', ticketId: 'MAS-006' },
            { id: 'hist-6-4', timestamp: getDateDaysAgo(15), userId: 'carol-danvers', action: 'Status Changed', fromStatus: 'En Progreso', toStatus: 'Cerrado', details: 'Capacitación completada exitosamente.', ticketId: 'MAS-006' }
        ]
    },
     {
        id: 'MAS-007',
        title: 'Issue: Login intermitente para usuarios TLA',
        description: 'Algunos usuarios de TLA reportan problemas para iniciar sesión de forma intermitente.',
        status: 'Reabierto', type: 'Issue', assigneeId: 'admin',
        lastUpdated: getDateDaysAgo(1), provider: 'TLA', branch: 'PROD', priority: 'Alta',
        requestingUserId: 'client-tla2', githubRepository: 'maximo-tla',
        history: [
            { id: 'hist-7-1', timestamp: getDateDaysAgo(12), userId: 'client-tla2', action: 'Created', toStatus: 'Abierto', toType: 'Issue', details: 'Reporte de Issue por cliente TLA', ticketId: 'MAS-007' },
            { id: 'hist-7-2', timestamp: getDateDaysAgo(11), userId: 'superuser', action: 'Assignee Changed', details: 'Asignado a admin', ticketId: 'MAS-007' },
            { id: 'hist-7-3', timestamp: getDateDaysAgo(8), userId: 'admin', action: 'Status Changed', fromStatus: 'En Progreso', toStatus: 'Resuelto', details: 'Solución implementada y probada.', ticketId: 'MAS-007' },
            { id: 'hist-7-4', timestamp: getDateDaysAgo(1), userId: 'client-tla2', action: 'Status Changed', fromStatus: 'Resuelto', toStatus: 'Reabierto', details: 'El problema persiste para algunos usuarios.', ticketId: 'MAS-007' }
        ]
    },
];

async function ensureTicketsMockDataSeeded(): Promise<void> {
  if (typeof window === 'undefined') {
    if (!isFirebaseProperlyConfigured) {
        console.warn(`[${SERVICE_NAME}] Mock data seeding (server-side): Firebase not properly configured. Cannot seed to Firestore.`);
    }
    return;
  }

  const isSeededInLocalStorage = localStorage.getItem(MOCK_TICKETS_SEEDED_FLAG_V7) === 'true';

  if (isSeededInLocalStorage && isFirebaseProperlyConfigured && db && ticketsCollectionRef) {
    try {
        const firstTicket = await getDoc(doc(ticketsCollectionRef, ticketsToSeed[0].id));
        if (firstTicket.exists()) {
            // console.log(`[${SERVICE_NAME}] Mock data (v7) already confirmed in Firestore. Skipping further seeding checks.`);
            return;
        }
    } catch (e) {
        console.warn(`[${SERVICE_NAME}] Error checking Firestore seed status (client might be offline or other Firestore issue). Will proceed with localStorage check and potential re-seed to Firestore if online. Error:`, e);
    }
  }

  if (!isSeededInLocalStorage) {
    console.log(`[${SERVICE_NAME}] Attempting to seed Tickets mock data (v7) to localStorage...`);
    try {
      localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(ticketsToSeed));
      localStorage.setItem(MOCK_TICKETS_SEEDED_FLAG_V7, 'true');
      console.log(`[${SERVICE_NAME}] Tickets mock data (v7) seeded to localStorage. Seeding flag set.`);
    } catch (e) {
      console.error(`[${SERVICE_NAME}] CRITICAL - Failed to seed Tickets mock data to localStorage. Local fallback may not work. Error:`, e);
    }
  }
  

  if (isFirebaseProperlyConfigured && db && navigator.onLine && ticketsCollectionRef) {
    try {
      const firstTicketSnap = await getDoc(doc(ticketsCollectionRef, ticketsToSeed[0].id));
      if (!firstTicketSnap.exists()) {
        const batch = writeBatch(db);
        console.log(`[${SERVICE_NAME}] Preparing to seed Tickets to Firestore (v7)...`);
        for (const ticketData of ticketsToSeed) {
          batch.set(doc(ticketsCollectionRef, ticketData.id), ticketData);
        }
        await batch.commit();
        console.log(`[${SERVICE_NAME}] Initial Tickets (v7) committed to Firestore.`);
      } else {
        // console.log(`[${SERVICE_NAME}] Firestore already contains key Tickets mock data (v7). Skipping Firestore Tickets seed.`);
      }
    } catch (error) {
      console.warn(`[${SERVICE_NAME}] Error during Firestore Tickets seeding (v7): `, error);
    }
  } else if (typeof window !== 'undefined'){
    let reason = "";
    if (!isFirebaseProperlyConfigured) reason += "Firebase not properly configured. ";
    else if (!db) reason += "Firestore db instance is null. ";
    else if (!ticketsCollectionRef) reason += "ticketsCollectionRef is null. ";
    else if (!navigator.onLine) reason += "Client is offline. ";
    // console.log(`[${SERVICE_NAME}] Skipping Firestore Tickets seeding (v7). ${reason}Will rely on localStorage if already seeded there.`);
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
        try {
            localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(
                requestingUserId ? 
                (JSON.parse(localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY) || '[]') as Ticket[]).filter(t => t.requestingUserId !== requestingUserId).concat(tickets)
                : tickets
            ));
        } catch (e) {
            console.warn(`[${SERVICE_NAME}] Failed to update localStorage cache for tickets after Firestore fetch. Error:`, e);
        }
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
            try {
                const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
                let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
                const ticketIndex = tickets.findIndex(t => t.id === ticketId);
                if (ticketIndex > -1) tickets[ticketIndex] = ticketData; else tickets.push(ticketData);
                localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
            } catch (e) {
                console.warn(`[${SERVICE_NAME}] Failed to update localStorage cache for ticket ${ticketId} after Firestore fetch. Error:`, e);
            }
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
  
  const currentTicket = await getTicketById(ticketId);

  if (!currentTicket) {
    console.error(`[${SERVICE_NAME}] (updateTicket): Ticket ${ticketId} not found.`);
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

  // Attempt to save to Firestore
  if (isFirebaseProperlyConfigured && db && ticketsCollectionRef) {
    try {
      const ticketDocRef = doc(ticketsCollectionRef, ticketId);
      await setDoc(ticketDocRef, updatedTicketData);
      console.log(`[${SERVICE_NAME}] (updateTicket): Ticket ${ticketId} updated in Firestore successfully.`);

      if (typeof window !== 'undefined') {
        try {
          const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
          let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
          const ticketIndex = tickets.findIndex(t => t.id === ticketId);
          if (ticketIndex > -1) {
            tickets[ticketIndex] = updatedTicketData;
          } else {
            tickets.push(updatedTicketData);
          }
          localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
          console.log(`[${SERVICE_NAME}] (updateTicket): Local ticket cache updated after successful Firestore update.`);
        } catch (e) {
          console.warn(`[${SERVICE_NAME}] (updateTicket): Failed to update localStorage cache for ticket ${ticketId} after Firestore success. Error:`, e);
        }
      }
      return updatedTicketData;

    } catch (firestoreError) {
      console.error(`[${SERVICE_NAME}] (updateTicket): Error updating Ticket ${ticketId} in Firestore: `, firestoreError);
      if (typeof window !== 'undefined') {
        console.warn(`[${SERVICE_NAME}] (updateTicket): Firestore update failed for ${ticketId}. Attempting localStorage update only.`);
        try {
          const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
          let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
          const ticketIndex = tickets.findIndex(t => t.id === ticketId);
          if (ticketIndex > -1) {
            tickets[ticketIndex] = updatedTicketData;
          } else {
            console.warn(`[${SERVICE_NAME}] (updateTicket): Ticket ${ticketId} not found in localStorage cache during fallback update, adding it.`);
            tickets.push(updatedTicketData);
          }
          localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
          console.log(`[${SERVICE_NAME}] (updateTicket): Ticket ${ticketId} updated in localStorage (Firestore update failed).`);
          return updatedTicketData;
        } catch (localStorageError) {
          console.error(`[${SERVICE_NAME}] (updateTicket): CRITICAL - Error updating ticket ${ticketId} in localStorage after Firestore failure. Error: `, localStorageError);
          return null; 
        }
      } else {
        return null;
      }
    }
  } else {
    // Firebase not configured, attempt localStorage update only (if in client environment)
    if (typeof window !== 'undefined') {
      console.warn(`[${SERVICE_NAME}] (updateTicket): Firebase not configured. Attempting localStorage update for ticket ${ticketId}.`);
      try {
        const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
        let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
        const ticketIndex = tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex > -1) {
          tickets[ticketIndex] = updatedTicketData;
        } else {
          console.warn(`[${SERVICE_NAME}] (updateTicket): Ticket ${ticketId} not found in localStorage cache (Firebase not configured), adding it.`);
          tickets.push(updatedTicketData);
        }
        localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
        console.log(`[${SERVICE_NAME}] (updateTicket): Ticket ${ticketId} updated in localStorage (Firebase not configured).`);
        return updatedTicketData;
      } catch (localStorageError) {
        console.error(`[${SERVICE_NAME}] (updateTicket): Error updating ticket ${ticketId} in localStorage (Firebase not configured). Error: `, localStorageError);
        return null;
      }
    } else {
      console.error(`[${SERVICE_NAME}] (updateTicket): Cannot update ticket ${ticketId}. Firebase not configured and not in client environment for localStorage fallback.`);
      return null;
    }
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
  
  // Determine githubRepository based on provider
  if (ticketData.provider) {
      const organizations = await getOrganizations(); // This might use localStorage if Firebase is down
      const organization = organizations.find(org => org.name === ticketData.provider);
      if (organization?.githubRepository) {
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

  if (!isFirebaseProperlyConfigured || !db || !ticketsCollectionRef) {
    if (typeof window !== 'undefined') {
      console.warn(`[${SERVICE_NAME}] (createTicket): Attempting to save ticket locally due to Firebase issue.`);
      try {
        const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
        let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
        tickets.unshift(newTicket);
        localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
        console.log(`[${SERVICE_NAME}] (createTicket): Ticket ${newTicketId} saved to localStorage successfully.`);
      } catch (localError) {
        console.error(`[${SERVICE_NAME}] (createTicket): CRITICAL - Error saving ticket to localStorage. The ticket is created in memory for this session but will not persist locally across sessions if Firebase remains unavailable. Error: `, localError);
      }
      return newTicket; // Return ticket even if localStorage fails, for in-session use
    }
    // If not client-side and Firebase isn't configured
    console.error(
      `[${SERVICE_NAME}] (createTicket): Cannot create ticket. Firebase not properly configured, or db/collection instance is null, and not in a client environment for localStorage fallback.`
    );
    return null;
  }
  
  try {
    const ticketDocRef = doc(ticketsCollectionRef, newTicketId);
    await setDoc(ticketDocRef, newTicket);
    console.log(`[${SERVICE_NAME}] (createTicket): Ticket ${newTicketId} created in Firestore.`);

    if (typeof window !== 'undefined') {
        try {
            const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
            let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
            tickets.unshift(newTicket);
            localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
            console.log(`[${SERVICE_NAME}] (createTicket): Local ticket cache updated after Firestore create.`);
        } catch (e) {
            console.warn(`[${SERVICE_NAME}] (createTicket): Failed to update localStorage cache after Firestore create. Error:`, e);
        }
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
            try {
                const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
                let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
                const ticketIndex = tickets.findIndex(t => t.id === ticketId);
                if (ticketIndex > -1) tickets[ticketIndex] = updatedTicketData; else tickets.push(updatedTicketData);
                localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
            } catch (e) {
                console.warn(`[${SERVICE_NAME}] (addRestorationToTicketHistory): Failed to update localStorage cache for ticket ${ticketId}. Error:`, e);
            }
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
            try {
                const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
                let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
                const ticketIndex = tickets.findIndex(t => t.id === ticketId);
                if (ticketIndex > -1) tickets[ticketIndex] = updatedTicketData; else tickets.push(updatedTicketData);
                localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
            } catch (e) {
                console.warn(`[${SERVICE_NAME}] (addCommentToTicket): Failed to update localStorage cache for ticket ${ticketId}. Error:`, e);
            }
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
        try {
            const storedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
            let tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
            const ticketIndex = tickets.findIndex(t => t.id === ticketId);
            if (ticketIndex > -1) tickets[ticketIndex] = updatedTicketData; else tickets.push(updatedTicketData);
            localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
        } catch (e) {
            console.warn(`[${SERVICE_NAME}] (addAttachmentsToTicket): Failed to update localStorage cache for ticket ${ticketId}. Error:`, e);
        }
    }
    return updatedTicketData;
  } catch (error) {
    console.error(`[${SERVICE_NAME}] (addAttachmentsToTicket): Error adding attachments to Ticket in Firestore:`, error);
     return null;
  }
}
