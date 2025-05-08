
import { db, isFirebaseProperlyConfigured } from '@/lib/firebase'; // Import isFirebaseProperlyConfigured
import { collection, doc, getDoc, getDocs, setDoc, query, where, type CollectionReference, type DocumentData } from 'firebase/firestore';
import type { User as AuthContextUserType } from '@/context/auth-context'; 

/**
 * Represents a user document in Firestore.
 * The document ID in Firestore will be the user's username.
 */
export interface UserDoc {
  id: string; 
  username: string;
  name: string; 
  email: string; 
  password?: string; 
  role: 'admin' | 'client' | 'superuser';
  company?: string;
  phone?: string;
  position?: string;
}

// Interface for organizations (companies)
export interface Organization {
  id: string; 
  name: string; 
  githubRepository?: string; 
}

let usersCollectionRef: CollectionReference<DocumentData> | null = null;
let organizationsCollectionRef: CollectionReference<DocumentData> | null = null;

if (isFirebaseProperlyConfigured && db) {
  usersCollectionRef = collection(db, 'users');
  organizationsCollectionRef = collection(db, 'organizations');
}


const MOCK_DATA_SEEDED_FLAG_V4 = 'mock_data_seeded_v4'; 
const LOCAL_STORAGE_USERS_KEY = 'firestore_mock_users';
const LOCAL_STORAGE_ORGS_KEY = 'firestore_mock_orgs';

const usersToSeed: UserDoc[] = [
  { id: 'admin', username: 'admin', name: 'Administrator Portal', email: 'admin@portal.com', password: 'password', role: 'admin', company: 'Maximo Corp', phone: '555-0000', position: 'System Administrator' },
  { id: 'superuser', username: 'superuser', name: 'Super Usuario Portal', email: 'superuser@portal.com', password: 'password', role: 'superuser', company: 'System Corp', phone: '555-9999', position: 'System Super User' },
  { id: 'client-tla1', username: 'client-tla1', name: 'Cliente TLA Primario', email: 'client.tla1@example.com', password: 'password', role: 'client', company: 'TLA', phone: '555-0101', position: 'Client User' },
  { id: 'client-fema1', username: 'client-fema1', name: 'Cliente FEMA Primario', email: 'client.fema1@example.com', password: 'password', role: 'client', company: 'FEMA', phone: '555-0202', position: 'Client User' },
  { id: 'client-generic1', username: 'client-generic1', name: 'Cliente Genérico Uno', email: 'client.generic1@example.com', password: 'password', role: 'client', company: 'Other Company', phone: '555-0303', position: 'Client User' },
  { id: 'client-tla2', username: 'client-tla2', name: 'Cliente TLA Secundario', email: 'client.tla2@example.com', password: 'password', role: 'client', company: 'TLA', phone: '555-0102', position: 'Client Contact' },
  { id: 'another-admin', username: 'another-admin', name: 'Técnico Secundario', email: 'tech2@portal.com', password: 'password', role: 'admin', company: 'Maximo Corp', phone: '555-0001', position: 'Technician' },
  { id: 'alice-wonderland', username: 'alice-wonderland', name: 'Alice Wonderland', email: 'alice@portal.com', password: 'password', role: 'admin', company: 'Maximo Corp', phone: 'N/A', position: 'Developer' },
  { id: 'bob-the-builder', username: 'bob-the-builder', name: 'Bob The Builder', email: 'bob@portal.com', password: 'password', role: 'admin', company: 'Maximo Corp', phone: 'N/A', position: 'Developer' },
];

const orgsToSeed: Organization[] = [
  { id: 'tla', name: 'TLA', githubRepository: 'maximo-tla' },
  { id: 'fema', name: 'FEMA', githubRepository: 'maximo-fema' },
  { id: 'system-corp', name: 'System Corp' },
  { id: 'maximo-corp', name: 'Maximo Corp' },
  { id: 'other-company', name: 'Other Company', githubRepository: 'maximo-generic' },
];

export async function ensureMockDataSeeded(): Promise<void> {
  if (typeof window === 'undefined') { 
    // console.log("Skipping ensureMockDataSeeded on server-side.");
    return;
  }
  if (localStorage.getItem(MOCK_DATA_SEEDED_FLAG_V4) === 'true') {
    return;
  }

  console.log("Attempting to seed initial mock data (v4) to localStorage and potentially Firestore...");

  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(usersToSeed));
  localStorage.setItem(LOCAL_STORAGE_ORGS_KEY, JSON.stringify(orgsToSeed));
  console.log("Mock data (v4) seeded to localStorage.");

  if (isFirebaseProperlyConfigured && db && navigator.onLine) {
    try {
      const adminUserDoc = await getDoc(doc(db, "users", "admin"));
      if (!adminUserDoc.exists() || !adminUserDoc.data()?.email) { 
        console.log("Seeding users to Firestore (v4)...");
        for (const userData of usersToSeed) {
          const { id, ...dataToStore } = userData;
          await setDoc(doc(db, "users", id), dataToStore);
        }
        console.log("Initial users (v4) seeded to Firestore.");
      } else {
        console.log("Firestore 'users' collection seems to have data (admin user with email exists). Skipping Firestore user seed.");
      }

      const tlaOrgDoc = await getDoc(doc(db, "organizations", "tla"));
      if (!tlaOrgDoc.exists()) {
         console.log("Seeding organizations to Firestore (v4)...");
        for (const orgData of orgsToSeed) {
          await setDoc(doc(db, "organizations", orgData.id), orgData);
        }
        console.log("Initial organizations (v4) seeded to Firestore.");
      } else {
        console.log("Firestore 'organizations' collection seems to have data (TLA org exists). Skipping Firestore org seed.");
      }
    } catch (error) {
      console.warn("Error during Firestore seeding (v4) (client might be offline or other Firestore issue): ", error);
    }
  } else {
    let reason = "";
    if (!isFirebaseProperlyConfigured) reason += "Firebase not properly configured (e.g., missing Project ID). ";
    if (!db) reason += "Firestore db instance is null. ";
    if (typeof navigator !== 'undefined' && !navigator.onLine) reason += "Client is offline. ";
    console.log(`Skipping Firestore seeding operations (v4). ${reason}Will rely on localStorage.`);
  }
  
  localStorage.setItem(MOCK_DATA_SEEDED_FLAG_V4, 'true');
  console.log("Mock data seeding process (v4) complete. Seeding flag set.");
}


export async function getUsers(): Promise<UserDoc[]> {
  await ensureMockDataSeeded(); // Ensures localStorage is seeded if on client
  await new Promise(resolve => setTimeout(resolve, 20)); 

  if (typeof window !== 'undefined') {
    const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (storedUsers) {
      try {
        return JSON.parse(storedUsers);
      } catch (e) {
        console.error("Error parsing users from localStorage, falling back to Firestore if possible.", e);
        localStorage.removeItem(LOCAL_STORAGE_USERS_KEY); // Clear corrupted data
      }
    }
  }

  if (!isFirebaseProperlyConfigured || !usersCollectionRef) {
    if (typeof window !== 'undefined') {
      console.warn("Cannot fetch users from Firestore: Firebase not properly configured or usersCollectionRef is null. Returning empty array as client has no localStorage data.");
    } else {
      console.warn("Cannot fetch users from Firestore (server-side): Firebase not properly configured or usersCollectionRef is null.");
    }
    return []; 
  }

  console.log("Fetching users from Firestore (localStorage cache was not available, corrupted, or on server).");
  try {
    const querySnapshot = await getDocs(usersCollectionRef);
    const users: UserDoc[] = [];
    querySnapshot.forEach((docSnap) => { 
      users.push({ id: docSnap.id, ...docSnap.data() } as UserDoc);
    });
    // Re-populate localStorage if on client and it was empty/corrupted
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
    }
    return users;
  } catch (error) {
    console.error("Error fetching users from Firestore: ", error);
    return []; 
  }
}

export async function getUserById(userId: string): Promise<UserDoc | undefined> {
  await ensureMockDataSeeded(); // Ensures localStorage is seeded if on client
  await new Promise(resolve => setTimeout(resolve, 10)); 

  if (typeof window !== 'undefined') {
    const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (storedUsers) {
      try {
        const users: UserDoc[] = JSON.parse(storedUsers);
        const user = users.find(u => u.id === userId);
        if (user) return user;
      } catch (e) {
        console.error("Error parsing users from localStorage for getUserById", e);
        // Fall through to Firestore if possible
      }
    }
  }
  
  if (!isFirebaseProperlyConfigured || !db) {
     if (typeof window === 'undefined') {
      console.warn(`Cannot fetch user ${userId} from Firestore (server-side): Firebase not properly configured or db is null.`);
    } else {
      console.warn(`User ${userId} not in localStorage, and cannot fetch from Firestore: Firebase not properly configured or db is null.`);
    }
    return undefined;
  }

  console.log(`Fetching user ${userId} from Firestore (not in localStorage cache or on server).`);
  try {
    if (!userId) return undefined;
    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as UserDoc;
    }
    return undefined;
  } catch (error) {
    console.error(`Error fetching user by ID (${userId}) from Firestore: `, error);
    return undefined;
  }
}


export async function createUserInFirestore(userData: AuthContextUserType): Promise<boolean> {
  if (!userData.username || !userData.email || !userData.password) { 
    console.error("Username, email, and password are required to create a user.");
    return false;
  }
  
  await ensureMockDataSeeded(); // Ensures localStorage is seeded if on client

  const userToStore: UserDoc = {
      id: userData.id,
      username: userData.username,
      name: userData.name,
      email: userData.email,
      password: userData.password, 
      role: userData.role,
      company: userData.company,
      phone: userData.phone,
      position: userData.position,
  };

  let localStorageSuccess = false;
  if (typeof window !== 'undefined') {
    try {
      const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      let users: UserDoc[] = storedUsers ? JSON.parse(storedUsers) : [];
      const userIndex = users.findIndex(u => u.id === userToStore.id);

      if (userIndex > -1) {
        users[userIndex] = userToStore;
      } else {
        users.push(userToStore);
      }
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
      console.log(`User ${userToStore.username} (email: ${userToStore.email}) created/updated in localStorage.`);
      localStorageSuccess = true;
    } catch (e) {
      console.error("Error updating localStorage for user:", e);
      localStorageSuccess = false;
    }
  }
  
  if (!isFirebaseProperlyConfigured || !db) {
    console.warn(`Skipping Firestore update for user ${userToStore.username}: Firebase not properly configured or db is null.`);
    return localStorageSuccess; // Return success based on localStorage if Firestore isn't an option
  }

  try {
    const userDocRef = doc(db, "users", userToStore.id); 
    const { id: firestoreDocId, ...dataForFirestore } = userToStore; // Exclude 'id' from data written to Firestore doc
    await setDoc(userDocRef, dataForFirestore, { merge: true });
    console.log(`User ${userToStore.username} (email: ${userToStore.email}) created/updated in Firestore.`);
    return true; // Firestore success
  } catch (error) {
    console.error("Error creating/updating user in Firestore: ", error);
    return false; // Firestore failure
  }
}


export async function getOrganizations(): Promise<Organization[]> {
  await ensureMockDataSeeded(); // Ensures localStorage is seeded if on client
  await new Promise(resolve => setTimeout(resolve, 20)); 

  if (typeof window !== 'undefined') {
    const storedOrgs = localStorage.getItem(LOCAL_STORAGE_ORGS_KEY);
    if (storedOrgs) {
      try {
        return JSON.parse(storedOrgs);
      } catch (e) {
        console.error("Error parsing organizations from localStorage, falling back to Firestore.", e);
        localStorage.removeItem(LOCAL_STORAGE_ORGS_KEY); // Clear corrupted data
      }
    }
  }

  if (!isFirebaseProperlyConfigured || !organizationsCollectionRef) {
    if (typeof window !== 'undefined') {
        console.warn("Cannot fetch organizations from Firestore: Firebase not properly configured or organizationsCollectionRef is null. Returning empty array as client has no localStorage data.");
    } else {
        console.warn("Cannot fetch organizations from Firestore (server-side): Firebase not properly configured or organizationsCollectionRef is null.");
    }
    return [];
  }
  
  console.log("Fetching organizations from Firestore (localStorage cache was not available, corrupted, or on server).");
  try {
    const querySnapshot = await getDocs(organizationsCollectionRef);
    const organizations: Organization[] = [];
    querySnapshot.forEach((docSnap) => { 
      organizations.push({ id: docSnap.id, ...docSnap.data() } as Organization);
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_ORGS_KEY, JSON.stringify(organizations)); 
    }
    return organizations;
  } catch (error) {
    console.error("Error fetching organizations from Firestore: ", error);
    return [];
  }
}

export async function createOrUpdateOrganization(orgData: Organization): Promise<boolean> {
  if (!orgData.id || !orgData.name) {
    console.error("Organization ID and Name are required.");
    return false;
  }
  await ensureMockDataSeeded(); // Ensures localStorage is seeded if on client

  let localStorageSuccess = false;
  if (typeof window !== 'undefined') {
    try {
      const storedOrgs = localStorage.getItem(LOCAL_STORAGE_ORGS_KEY);
      let organizations: Organization[] = storedOrgs ? JSON.parse(storedOrgs) : [];
      const orgIndex = organizations.findIndex(o => o.id === orgData.id);
      if (orgIndex > -1) {
        organizations[orgIndex] = orgData;
      } else {
        organizations.push(orgData);
      }
      localStorage.setItem(LOCAL_STORAGE_ORGS_KEY, JSON.stringify(organizations));
      console.log(`Organization ${orgData.name} created/updated in localStorage.`);
      localStorageSuccess = true;
    } catch (e) {
      console.error("Error updating localStorage for organization:", e);
      localStorageSuccess = false;
    }
  }

  if (!isFirebaseProperlyConfigured || !db) {
    console.warn(`Skipping Firestore update for organization ${orgData.name}: Firebase not properly configured or db is null.`);
    return localStorageSuccess; // Return success based on localStorage if Firestore isn't an option
  }

  try {
    const orgDocRef = doc(db, "organizations", orgData.id);
    await setDoc(orgDocRef, orgData, { merge: true });
    console.log(`Organization ${orgData.name} created/updated in Firestore.`);
    return true; // Firestore success
  } catch (error) {
    console.error("Error creating/updating organization in Firestore: ", error);
    return false; // Firestore failure
  }
}

export async function getOrganizationById(orgId: string): Promise<Organization | undefined> {
  await ensureMockDataSeeded(); // Ensures localStorage is seeded if on client
  await new Promise(resolve => setTimeout(resolve, 10));

  if (typeof window !== 'undefined') {
    const storedOrgs = localStorage.getItem(LOCAL_STORAGE_ORGS_KEY);
    if (storedOrgs) {
      try {
        const organizations: Organization[] = JSON.parse(storedOrgs);
        const org = organizations.find(o => o.id === orgId);
        if (org) return org;
      } catch (e) {
        console.error("Error parsing orgs from localStorage for getOrganizationById", e);
        // Fall through to Firestore if possible
      }
    }
  }
  
  if (!isFirebaseProperlyConfigured || !db) {
    if (typeof window === 'undefined') {
      console.warn(`Cannot fetch organization ${orgId} from Firestore (server-side): Firebase not properly configured or db is null.`);
    } else {
      console.warn(`Organization ${orgId} not in localStorage, and cannot fetch from Firestore: Firebase not properly configured or db is null.`);
    }
    return undefined;
  }

  console.log(`Fetching organization ${orgId} from Firestore (not in localStorage cache or on server).`);
  try {
    if (!orgId) return undefined;
    const orgDocRef = doc(db, "organizations", orgId);
    const docSnap = await getDoc(orgDocRef); 
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Organization;
    }
    return undefined;
  } catch (error) {
    console.error(`Error fetching organization by ID (${orgId}) from Firestore: `, error);
    return undefined;
  }
}
