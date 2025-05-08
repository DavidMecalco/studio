
import { db, isFirebaseProperlyConfigured } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, query, orderBy, writeBatch, type CollectionReference, type DocumentData } from 'firebase/firestore';
// import type { Ticket } from './tickets'; // No direct use of Ticket type here after removal of addDeploymentToTicketHistory

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

let deploymentLogsCollectionRef: CollectionReference<DocumentData> | null = null;
const SERVICE_NAME = 'DeploymentService';

if (db) { 
  deploymentLogsCollectionRef = collection(db, 'deployment_logs');
  console.log(`[SERVICE_INIT ${SERVICE_NAME}] Collection ref initialized (deployment_logs: ${!!deploymentLogsCollectionRef}) because db is available.`);
} else {
  console.warn(`[SERVICE_INIT ${SERVICE_NAME}] Firestore db instance is null. deploymentLogsCollectionRef not initialized. isFirebaseProperlyConfigured: ${isFirebaseProperlyConfigured}`);
}

const MOCK_DEPLOYMENT_SEEDED_FLAG_V5 = 'mock_deployment_seeded_v5';
const LOCAL_STORAGE_DEPLOYMENTS_KEY = 'firestore_mock_deployments_cache_v5';

const deploymentsToSeed: DeploymentLogEntry[] = [
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
        ticketIds: ['MAS-001'], // Updated to local ticket ID format
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
        ticketIds: ['MAS-002'], // Updated to local ticket ID format
      },
];

async function ensureDeploymentMockDataSeeded(): Promise<void> {
  if (typeof window === 'undefined') {
    if (!isFirebaseProperlyConfigured) {
         console.warn(`[${SERVICE_NAME}] Mock data seeding (server-side): Firebase not properly configured. Cannot seed to Firestore.`);
    }
    return;
  }

  const isSeededInLocalStorage = localStorage.getItem(MOCK_DEPLOYMENT_SEEDED_FLAG_V5) === 'true';

  if (isSeededInLocalStorage && isFirebaseProperlyConfigured && db && deploymentLogsCollectionRef) {
      try {
        const firstLog = await getDoc(doc(deploymentLogsCollectionRef, deploymentsToSeed[0].id));
        if (firstLog.exists()) {
            // console.log(`[${SERVICE_NAME}] Mock data (v5) already confirmed in Firestore. Skipping further seeding checks.`);
            return;
        }
    } catch (e) {
        console.warn(`[${SERVICE_NAME}] Error checking Firestore seed status for deployments. Will proceed with localStorage check and potential re-seed. Error:`, e);
    }
  }

  if (!isSeededInLocalStorage) {
    console.log(`[${SERVICE_NAME}] Attempting to seed Deployment mock data (v5) to localStorage...`);
    localStorage.setItem(LOCAL_STORAGE_DEPLOYMENTS_KEY, JSON.stringify(deploymentsToSeed));
    localStorage.setItem(MOCK_DEPLOYMENT_SEEDED_FLAG_V5, 'true');
    console.log(`[${SERVICE_NAME}] Deployment mock data (v5) seeded to localStorage. Seeding flag set.`);
  }
  

  if (isFirebaseProperlyConfigured && db && navigator.onLine && deploymentLogsCollectionRef) {
    try {
      const firstLogSnap = await getDoc(doc(deploymentLogsCollectionRef, deploymentsToSeed[0].id));
      if (!firstLogSnap.exists()) {
        const batch = writeBatch(db);
        console.log(`[${SERVICE_NAME}] Preparing to seed Deployment logs to Firestore (v5)...`);
        for (const logData of deploymentsToSeed) {
          batch.set(doc(deploymentLogsCollectionRef, logData.id), logData);
        }
        await batch.commit();
        console.log(`[${SERVICE_NAME}] Initial Deployment logs (v5) committed to Firestore.`);
      } else {
        // console.log(`[${SERVICE_NAME}] Firestore already contains key Deployment mock data (v5). Skipping Firestore Deployment seed.`);
      }
    } catch (error) {
      console.warn(`[${SERVICE_NAME}] Error during Firestore Deployment seeding (v5): `, error);
    }
  } else if (typeof window !== 'undefined'){
    let reason = "";
    if (!isFirebaseProperlyConfigured) reason += "Firebase not properly configured. ";
    else if (!db) reason += "Firestore db instance is null. ";
    else if (!deploymentLogsCollectionRef) reason += "deploymentLogsCollectionRef is null. ";
    else if (!navigator.onLine) reason += "Client is offline. ";
    // console.log(`[${SERVICE_NAME}] Skipping Firestore Deployment seeding (v5). ${reason}Will rely on localStorage if already seeded there.`);
  }
}


export async function getDeploymentLogs(): Promise<DeploymentLogEntry[]> {
  await ensureDeploymentMockDataSeeded();

  if (isFirebaseProperlyConfigured && db && deploymentLogsCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      // console.log(`[${SERVICE_NAME}] Fetching deployment logs from Firestore.`);
      const q = query(deploymentLogsCollectionRef, orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const logs: DeploymentLogEntry[] = [];
      querySnapshot.forEach((docSnap) => {
        logs.push(docSnap.data() as DeploymentLogEntry);
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_DEPLOYMENTS_KEY, JSON.stringify(logs)); // Update cache
      }
      return logs;
    } catch (error) {
      console.error(`[${SERVICE_NAME}] Error fetching deployment logs from Firestore. Falling back to localStorage (client-side). Error:`, error);
    }
  }

  if (typeof window !== 'undefined') {
    const storedLogs = localStorage.getItem(LOCAL_STORAGE_DEPLOYMENTS_KEY);
    if (storedLogs) {
      try {
        console.warn(`[${SERVICE_NAME}] Fetching deployment logs from localStorage (Firestore unavailable or offline).`);
        return JSON.parse(storedLogs).sort((a: DeploymentLogEntry, b: DeploymentLogEntry) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      } catch (e) {
        console.error(`[${SERVICE_NAME}] Error parsing deployment logs from localStorage. Error:`, e);
      }
    }
    console.warn(`[${SERVICE_NAME}] No deployment logs found in localStorage cache.`);
    return [];
  }
  console.warn(`[${SERVICE_NAME}] No deployment logs found. (Server-side context and Firestore is unavailable/not configured).`);
  return [];
}

export async function getDeploymentLogById(deploymentId: string): Promise<DeploymentLogEntry | null> {
  await ensureDeploymentMockDataSeeded();

   if (isFirebaseProperlyConfigured && db && deploymentLogsCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      if (!deploymentId) return null;
      const logDocRef = doc(deploymentLogsCollectionRef, deploymentId);
      const docSnap = await getDoc(logDocRef);
      if (docSnap.exists()) {
        const logData = docSnap.data() as DeploymentLogEntry;
        if (typeof window !== 'undefined') { 
            const storedLogs = localStorage.getItem(LOCAL_STORAGE_DEPLOYMENTS_KEY);
            let logs: DeploymentLogEntry[] = storedLogs ? JSON.parse(storedLogs) : [];
            const logIndex = logs.findIndex(l => l.id === deploymentId);
            if (logIndex > -1) logs[logIndex] = logData; else logs.push(logData);
            localStorage.setItem(LOCAL_STORAGE_DEPLOYMENTS_KEY, JSON.stringify(logs));
        }
        return logData;
      }
    } catch (error) {
      console.error(`[${SERVICE_NAME}] Error fetching deployment log ${deploymentId} from Firestore. Falling back to localStorage (client-side). Error:`, error);
    }
  }

  if (typeof window !== 'undefined') {
    const storedLogs = localStorage.getItem(LOCAL_STORAGE_DEPLOYMENTS_KEY);
    if (storedLogs) {
      try {
        const logs: DeploymentLogEntry[] = JSON.parse(storedLogs);
        const log = logs.find(d => d.id === deploymentId);
        if (log) {
            console.warn(`[${SERVICE_NAME}] Fetching deployment log ${deploymentId} from localStorage (Firestore unavailable or offline).`);
            return log;
        }
      } catch (e) {
        console.error(`[${SERVICE_NAME}] Error parsing deployment logs from localStorage for getDeploymentLogById. Error:`, e);
      }
    }
    // console.warn(`[${SERVICE_NAME}] Deployment log ${deploymentId} not found in localStorage cache.`);
    return null;
  }
  console.warn(`[${SERVICE_NAME}] Deployment log ${deploymentId} not found. (Server-side context and Firestore is unavailable/not configured).`);
  return null;
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

export async function createDeploymentLog(data: CreateDeploymentLogData): Promise<DeploymentLogEntry | null> {
  if (!isFirebaseProperlyConfigured || !db || !deploymentLogsCollectionRef) {
    console.error(
        `[${SERVICE_NAME}] (createDeploymentLog): Cannot create deployment log. ` +
        `isFirebaseProperlyConfigured: ${isFirebaseProperlyConfigured}, db: ${!!db}, deploymentLogsCollectionRef: ${!!deploymentLogsCollectionRef}. ` +
        `Firebase not properly configured, or db/collection instance is null.`
    );
    return null;
  }

  try {
    const newLogId = `deploy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newLogEntry: DeploymentLogEntry = {
      id: newLogId,
      timestamp: new Date().toISOString(),
      ...data,
    };

    const logDocRef = doc(deploymentLogsCollectionRef, newLogId);
    await setDoc(logDocRef, newLogEntry);
    console.log(`[${SERVICE_NAME}] (createDeploymentLog): Deployment log ${newLogId} created in Firestore.`);

    if (typeof window !== 'undefined') {
        const storedLogs = localStorage.getItem(LOCAL_STORAGE_DEPLOYMENTS_KEY);
        let logs: DeploymentLogEntry[] = storedLogs ? JSON.parse(storedLogs) : [];
        logs.unshift(newLogEntry);
        localStorage.setItem(LOCAL_STORAGE_DEPLOYMENTS_KEY, JSON.stringify(logs));
        console.log(`[${SERVICE_NAME}] (createDeploymentLog): Local deployment log cache updated after Firestore create.`);
    }
    return newLogEntry;
  } catch (error) {
    console.error(`[${SERVICE_NAME}] (createDeploymentLog): Error creating deployment log in Firestore: `, error);
    return null;
  }
}
