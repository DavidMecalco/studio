
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
if (isFirebaseProperlyConfigured && db) {
  deploymentLogsCollectionRef = collection(db, 'deployment_logs');
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
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(MOCK_DEPLOYMENT_SEEDED_FLAG_V5) === 'true' && isFirebaseProperlyConfigured && db && deploymentLogsCollectionRef) {
      try {
        const firstLog = await getDoc(doc(deploymentLogsCollectionRef, deploymentsToSeed[0].id));
        if (firstLog.exists()) return;
    } catch (e) {/* ignore, proceed to seed */}
  }

  console.log("Attempting to seed Deployment mock data (v5)...");
  localStorage.setItem(LOCAL_STORAGE_DEPLOYMENTS_KEY, JSON.stringify(deploymentsToSeed));
  console.log("Deployment mock data (v5) seeded to localStorage.");

  if (isFirebaseProperlyConfigured && db && navigator.onLine && deploymentLogsCollectionRef) {
    try {
      const batch = writeBatch(db);
      let firestoreNeedsSeeding = false;
      const firstLogSnap = await getDoc(doc(deploymentLogsCollectionRef, deploymentsToSeed[0].id));

      if (!firstLogSnap.exists()) {
        firestoreNeedsSeeding = true;
        console.log("Preparing to seed Deployment logs to Firestore (v5)...");
        for (const logData of deploymentsToSeed) {
          batch.set(doc(deploymentLogsCollectionRef, logData.id), logData);
        }
      }
      if (firestoreNeedsSeeding) {
        await batch.commit();
        console.log("Initial Deployment logs (v5) committed to Firestore.");
      } else {
        console.log("Firestore already contains key Deployment mock data (v5). Skipping Firestore Deployment seed.");
      }
    } catch (error) {
      console.warn("Error during Firestore Deployment seeding (v5): ", error);
    }
  } else {
     console.log("Skipping Firestore Deployment seeding (v5). Firebase not configured, offline, or collection ref missing.");
  }
  localStorage.setItem(MOCK_DEPLOYMENT_SEEDED_FLAG_V5, 'true');
}


export async function getDeploymentLogs(): Promise<DeploymentLogEntry[]> {
  await ensureDeploymentMockDataSeeded();
  await new Promise(resolve => setTimeout(resolve, 20));

  if (isFirebaseProperlyConfigured && db && deploymentLogsCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      console.log("Fetching deployment logs from Firestore.");
      const q = query(deploymentLogsCollectionRef, orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const logs: DeploymentLogEntry[] = [];
      querySnapshot.forEach((docSnap) => {
        logs.push(docSnap.data() as DeploymentLogEntry);
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_DEPLOYMENTS_KEY, JSON.stringify(logs));
      }
      return logs;
    } catch (error) {
      console.error("Error fetching deployment logs from Firestore, falling back to localStorage if available: ", error);
    }
  }

  if (typeof window !== 'undefined') {
    const storedLogs = localStorage.getItem(LOCAL_STORAGE_DEPLOYMENTS_KEY);
    if (storedLogs) {
      try {
        console.warn("Fetching deployment logs from localStorage (Firestore unavailable or offline).");
        return JSON.parse(storedLogs).sort((a: DeploymentLogEntry, b: DeploymentLogEntry) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      } catch (e) {
        console.error("Error parsing deployment logs from localStorage.", e);
        return [];
      }
    }
  }
  console.warn("No deployment logs found in Firestore or localStorage.");
  return [];
}

export async function getDeploymentLogById(deploymentId: string): Promise<DeploymentLogEntry | null> {
  await ensureDeploymentMockDataSeeded();
  await new Promise(resolve => setTimeout(resolve, 10));

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
      console.error(`Error fetching deployment log ${deploymentId} from Firestore, falling back to localStorage: `, error);
    }
  }

  if (typeof window !== 'undefined') {
    const storedLogs = localStorage.getItem(LOCAL_STORAGE_DEPLOYMENTS_KEY);
    if (storedLogs) {
      try {
        const logs: DeploymentLogEntry[] = JSON.parse(storedLogs);
        const log = logs.find(d => d.id === deploymentId);
        if (log) {
            console.warn(`Fetching deployment log ${deploymentId} from localStorage (Firestore unavailable or offline).`);
            return log;
        }
      } catch (e) {
        console.error("Error parsing deployment logs from localStorage for getDeploymentLogById", e);
      }
    }
  }
  console.warn(`Deployment log ${deploymentId} not found in Firestore or localStorage.`);
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
    console.error("Cannot create deployment log: Firebase not properly configured or db/collectionRef is null.");
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
    console.log(`Deployment log ${newLogId} created in Firestore.`);

    if (typeof window !== 'undefined') {
        const storedLogs = localStorage.getItem(LOCAL_STORAGE_DEPLOYMENTS_KEY);
        let logs: DeploymentLogEntry[] = storedLogs ? JSON.parse(storedLogs) : [];
        logs.unshift(newLogEntry);
        localStorage.setItem(LOCAL_STORAGE_DEPLOYMENTS_KEY, JSON.stringify(logs));
    }
    return newLogEntry;
  } catch (error) {
    console.error("Error creating deployment log in Firestore: ", error);
    return null;
  }
}
