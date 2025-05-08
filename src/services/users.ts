
import { db, isFirebaseProperlyConfigured } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, query, where, writeBatch, type CollectionReference, type DocumentData } from 'firebase/firestore';
import type { User as AuthContextUserType } from '@/context/auth-context';

/**
 * Represents a user document in Firestore.
 * The document ID in Firestore will be the user's id field.
 */
export interface UserDoc {
  id: string;
  username: string;
  name: string;
  email: string;
  password?: string; // Stored for mock auth, should be hashed in a real app
  role: 'admin' | 'client' | 'superuser';
  company?: string;
  phone?: string;
  position?: string;
}

// Interface for organizations (companies)
export interface Organization {
  id: string; // slug-like-id
  name: string;
  githubRepository?: string;
}

let usersCollectionRef: CollectionReference<DocumentData> | null = null;
let organizationsCollectionRef: CollectionReference<DocumentData> | null = null;

if (db) { // Only initialize collection refs if db is available
  usersCollectionRef = collection(db, 'users');
  organizationsCollectionRef = collection(db, 'organizations');
} else {
  if (isFirebaseProperlyConfigured) { // If it was supposed to be configured but db is null
    console.warn("UserService: Firestore db instance is null. Collection references for users and organizations will not be initialized. Operations will rely on localStorage (client-side) or fail (server-side).");
  }
}


const MOCK_DATA_SEEDED_FLAG_V5 = 'mock_data_seeded_v5'; // Incremented version for reseeding if needed
const LOCAL_STORAGE_USERS_KEY = 'firestore_mock_users_cache_v5';
const LOCAL_STORAGE_ORGS_KEY = 'firestore_mock_orgs_cache_v5';

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
    if (!isFirebaseProperlyConfigured) {
        console.warn("Mock data seeding (server-side): Firebase not properly configured. Cannot seed to Firestore.");
    }
    // Server-side: No localStorage access, Firestore seeding depends on `isFirebaseProperlyConfigured`
    // If called from a server action, it should rely on Firestore if configured, or do nothing if not.
    return;
  }

  // Client-side seeding logic
  const isSeededInLocalStorage = localStorage.getItem(MOCK_DATA_SEEDED_FLAG_V5) === 'true';

  if (isSeededInLocalStorage && isFirebaseProperlyConfigured && db) {
    // Check if Firestore is also seeded to avoid re-seeding unnecessarily
    try {
        let firestoreUsersSeeded = false;
        let firestoreOrgsSeeded = false;

        if (usersCollectionRef) {
            const adminDoc = await getDoc(doc(usersCollectionRef, 'admin'));
            if (adminDoc.exists()) firestoreUsersSeeded = true;
        } else if (!usersCollectionRef && isFirebaseProperlyConfigured) {
            // usersCollectionRef is null but Firebase is configured - this is an issue, but for seeding check, treat as not seeded to Firestore
            firestoreUsersSeeded = false;
        } else if (!isFirebaseProperlyConfigured) {
            // If Firebase not configured, then local storage is the only truth
             firestoreUsersSeeded = true; // Effectively skip Firestore check
        }


        if (organizationsCollectionRef) {
            const tlaOrgDoc = await getDoc(doc(organizationsCollectionRef, 'tla'));
            if (tlaOrgDoc.exists()) firestoreOrgsSeeded = true;
        } else if (!organizationsCollectionRef && isFirebaseProperlyConfigured) {
            firestoreOrgsSeeded = false;
        } else if (!isFirebaseProperlyConfigured) {
            firestoreOrgsSeeded = true; // Effectively skip Firestore check
        }
        
        if (firestoreUsersSeeded && firestoreOrgsSeeded) {
            return; // Both seem seeded
        }

    } catch (e) {
        console.warn("Error checking Firestore seed status (client might be offline or other Firestore issue). Will proceed with localStorage check and potential re-seed to Firestore if online.", e);
    }
  }
  
  // Seed to localStorage if not already done or if flag is missing
  if (!isSeededInLocalStorage) {
    console.log("Attempting to seed initial mock data (v5) to localStorage...");
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(usersToSeed));
    localStorage.setItem(LOCAL_STORAGE_ORGS_KEY, JSON.stringify(orgsToSeed));
    localStorage.setItem(MOCK_DATA_SEEDED_FLAG_V5, 'true');
    console.log("Mock data (v5) seeded to localStorage. Seeding flag set.");
  }


  // Attempt to seed to Firestore if configured, online, and collections refs exist
  if (isFirebaseProperlyConfigured && db && navigator.onLine && (usersCollectionRef || organizationsCollectionRef)) {
    try {
      const batch = writeBatch(db);
      let firestoreNeedsFullSeeding = false; // Flag to commit batch

      // Check and seed users if usersCollectionRef exists
      if (usersCollectionRef) {
        const adminUserDocSnap = await getDoc(doc(usersCollectionRef, "admin"));
        if (!adminUserDocSnap.exists()) {
          firestoreNeedsFullSeeding = true;
          console.log("Preparing to seed users to Firestore (v5)...");
          for (const userData of usersToSeed) {
            const { id, ...dataToSeed } = userData; 
            batch.set(doc(usersCollectionRef, id), dataToSeed);
          }
        }
      }

      // Check and seed organizations if organizationsCollectionRef exists
      if (organizationsCollectionRef) {
        const tlaOrgDocSnap = await getDoc(doc(organizationsCollectionRef, "tla"));
        if (!tlaOrgDocSnap.exists()) {
          firestoreNeedsFullSeeding = true;
          console.log("Preparing to seed organizations to Firestore (v5)...");
          for (const orgData of orgsToSeed) {
             const { id, ...dataToSeed } = orgData; 
            batch.set(doc(organizationsCollectionRef, id), dataToSeed);
          }
        }
      }
      

      if (firestoreNeedsFullSeeding) {
        await batch.commit();
        console.log("Initial data (v5) committed to Firestore.");
      } else {
        console.log("Firestore already contains key mock data (v5) or relevant collections not available/configured for seeding. Skipping Firestore seed part if applicable.");
      }
    } catch (error) {
      console.warn("Error during Firestore seeding (v5) (client might be offline or other Firestore issue): ", error);
    }
  } else if (typeof window !== 'undefined') { // Only log this specific skip message on client
    let reason = "";
    if (!isFirebaseProperlyConfigured) reason += "Firebase not properly configured. ";
    else if (!db) reason += "Firestore db instance is null. ";
    else if (!navigator.onLine) reason += "Client is offline. ";
    else if (!usersCollectionRef && !organizationsCollectionRef) reason += "Users and Organizations collection references are null. ";
    else if (!usersCollectionRef) reason += "Users collection reference is null (might be okay if only orgs needed). ";
    else if (!organizationsCollectionRef) reason += "Organizations collection reference is null (might be okay if only users needed). ";
    
    console.log(`Skipping Firestore seeding operations (v5). ${reason}Will rely on localStorage if already seeded there.`);
  }
}


export async function getUsers(): Promise<UserDoc[]> {
  await ensureMockDataSeeded();

  if (isFirebaseProperlyConfigured && db && usersCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      console.log("Fetching users from Firestore.");
      const querySnapshot = await getDocs(usersCollectionRef);
      const users: UserDoc[] = [];
      querySnapshot.forEach((docSnap) => {
        users.push({ id: docSnap.id, ...docSnap.data() } as UserDoc);
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users)); // Update cache
      }
      return users;
    } catch (error) {
      console.error("Error fetching users from Firestore. Falling back to localStorage if available (client-side).", error);
      // Fall through to localStorage if on client
    }
  }

  // Fallback for client-side or if Firestore failed
  if (typeof window !== 'undefined') {
    const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (storedUsers) {
      try {
        console.warn("Fetching users from localStorage (Firestore unavailable or offline, or server-side access failed).");
        return JSON.parse(storedUsers);
      } catch (e) {
        console.error("Error parsing users from localStorage.", e);
      }
    }
    console.warn("No users found in localStorage cache.");
    return []; // Return empty if localStorage also fails or is empty
  }
  
  // Server-side and Firestore failed or not configured
  console.warn("No users found. (Server-side context and Firestore is unavailable/not configured).");
  return [];
}

export async function getUserById(userId: string): Promise<UserDoc | undefined> {
  await ensureMockDataSeeded();

  if (isFirebaseProperlyConfigured && db && usersCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      if (!userId) return undefined;
      const userDocRef = doc(usersCollectionRef, userId);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const userData = { id: docSnap.id, ...docSnap.data() } as UserDoc;
        if (typeof window !== 'undefined') { // Update localStorage cache on client
            const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
            let users: UserDoc[] = storedUsers ? JSON.parse(storedUsers) : [];
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex > -1) users[userIndex] = userData; else users.push(userData);
            localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
        }
        return userData;
      }
    } catch (error) {
      console.error(`Error fetching user by ID (${userId}) from Firestore. Falling back to localStorage (client-side).`, error);
      // Fall through to localStorage if on client
    }
  }
  
  // Fallback for client-side or if Firestore failed
  if (typeof window !== 'undefined') {
    const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (storedUsers) {
      try {
        const users: UserDoc[] = JSON.parse(storedUsers);
        const user = users.find(u => u.id === userId);
        if (user) {
            console.warn(`Fetching user ${userId} from localStorage (Firestore unavailable or offline, or server-side access failed).`);
            return user;
        }
      } catch (e) {
        console.error("Error parsing users from localStorage for getUserById", e);
      }
    }
    console.warn(`User ${userId} not found in localStorage cache.`);
    return undefined;
  }

  // Server-side and Firestore failed or not configured
  console.warn(`User ${userId} not found. (Server-side context and Firestore is unavailable/not configured).`);
  return undefined;
}


// This function is primarily called by server actions.
// It should only attempt Firestore operations and not fall back to localStorage for writes.
export async function createUserInFirestoreService(userData: AuthContextUserType): Promise<boolean> {
  if (!userData.id || !userData.username || !userData.email || !userData.password) {
    console.error("ID, Username, email, and password are required to create/update a user.");
    return false;
  }
  
  if (!isFirebaseProperlyConfigured || !db || !usersCollectionRef) {
    console.error(`UserService (createUserInFirestoreService): Cannot create/update user ${userData.username}. Firebase not properly configured, db instance is null, or usersCollectionRef is null.`);
    // This function, when called from a server action, should not attempt localStorage.
    // The action itself will return an error.
    return false;
  }

  try {
    const userDocRef = doc(usersCollectionRef, userData.id);
    const { id, ...dataForFirestore } = userData; 
    await setDoc(userDocRef, dataForFirestore, { merge: true });
    console.log(`User ${userData.username} (email: ${userData.email}) created/updated in Firestore.`);
    
    // After successful Firestore write, IF on the client, we can update the local cache.
    // However, server actions should rely on revalidation. For direct client-side calls (if any), this is okay.
     if (typeof window !== 'undefined') {
        const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
        let users: UserDoc[] = storedUsers ? JSON.parse(storedUsers) : [];
        const userIndex = users.findIndex(u => u.id === userData.id);
        const userToCache: UserDoc = { ...userData, password: userData.password! }; // Ensure password is included for cache
        if (userIndex > -1) users[userIndex] = userToCache; else users.push(userToCache);
        localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
        console.log("Local user cache updated after Firestore operation (createUserInFirestoreService).");
    }
    return true;
  } catch (error) {
    console.error(`Error creating/updating user ${userData.username} in Firestore: `, error);
    return false;
  }
}


export async function getOrganizations(): Promise<Organization[]> {
  await ensureMockDataSeeded();

  if (isFirebaseProperlyConfigured && db && organizationsCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      console.log("Fetching organizations from Firestore.");
      const querySnapshot = await getDocs(organizationsCollectionRef);
      const organizations: Organization[] = [];
      querySnapshot.forEach((docSnap) => {
        organizations.push({ id: docSnap.id, ...docSnap.data() } as Organization);
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_ORGS_KEY, JSON.stringify(organizations)); // Update cache
      }
      return organizations;
    } catch (error) {
      console.error("Error fetching organizations from Firestore. Falling back to localStorage if available (client-side).", error);
      // Fall through to localStorage if on client
    }
  }

  // Fallback for client-side or if Firestore failed
  if (typeof window !== 'undefined') {
    const storedOrgs = localStorage.getItem(LOCAL_STORAGE_ORGS_KEY);
    if (storedOrgs) {
      try {
        console.warn("Fetching organizations from localStorage (Firestore unavailable or offline, or server-side access failed).");
        return JSON.parse(storedOrgs);
      } catch (e) {
        console.error("Error parsing organizations from localStorage.", e);
      }
    }
    console.warn("No organizations found in localStorage cache.");
    return [];
  }

  // Server-side and Firestore failed or not configured
  console.warn("No organizations found. (Server-side context and Firestore is unavailable/not configured).");
  return [];
}

// This function is primarily called by server actions.
export async function createOrUpdateOrganization(orgData: Organization): Promise<boolean> {
  if (!orgData.id || !orgData.name) {
    console.error("Organization ID and Name are required.");
    return false;
  }

  if (!isFirebaseProperlyConfigured || !db || !organizationsCollectionRef) {
    console.error(`UserService (createOrUpdateOrganization): Cannot create/update organization ${orgData.name}. Firebase not properly configured, db instance is null, or organizationsCollectionRef is null.`);
    return false; 
  }

  try {
    const orgDocRef = doc(organizationsCollectionRef, orgData.id);
    const { id, ...dataForFirestore } = orgData;
    await setDoc(orgDocRef, dataForFirestore, { merge: true });
    console.log(`Organization ${orgData.name} created/updated in Firestore.`);
    
    // After successful Firestore write, IF on the client, we can update the local cache.
    if (typeof window !== 'undefined') {
        const storedOrgs = localStorage.getItem(LOCAL_STORAGE_ORGS_KEY);
        let organizations: Organization[] = storedOrgs ? JSON.parse(storedOrgs) : [];
        const orgIndex = organizations.findIndex(o => o.id === orgData.id);
        if (orgIndex > -1) organizations[orgIndex] = orgData; else organizations.push(orgData);
        localStorage.setItem(LOCAL_STORAGE_ORGS_KEY, JSON.stringify(organizations));
        console.log("Local organization cache updated after Firestore operation (createOrUpdateOrganization).");
    }
    return true;
  } catch (error) {
    console.error(`Error creating/updating organization ${orgData.name} in Firestore: `, error);
    return false; 
  }
}

export async function getOrganizationById(orgId: string): Promise<Organization | undefined> {
  await ensureMockDataSeeded();

  if (isFirebaseProperlyConfigured && db && organizationsCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      if (!orgId) return undefined;
      const orgDocRef = doc(organizationsCollectionRef, orgId);
      const docSnap = await getDoc(orgDocRef);
      if (docSnap.exists()) {
         const orgData = { id: docSnap.id, ...docSnap.data() } as Organization;
        if (typeof window !== 'undefined') { // Update localStorage cache on client
            const storedOrgs = localStorage.getItem(LOCAL_STORAGE_ORGS_KEY);
            let orgs: Organization[] = storedOrgs ? JSON.parse(storedOrgs) : [];
            const orgIndex = orgs.findIndex(o => o.id === orgId);
            if (orgIndex > -1) orgs[orgIndex] = orgData; else orgs.push(orgData);
            localStorage.setItem(LOCAL_STORAGE_ORGS_KEY, JSON.stringify(orgs));
        }
        return orgData;
      }
    } catch (error) {
      console.error(`Error fetching organization by ID (${orgId}) from Firestore. Falling back to localStorage (client-side).`, error);
      // Fall through to localStorage if on client
    }
  }

  // Fallback for client-side or if Firestore failed
  if (typeof window !== 'undefined') {
    const storedOrgs = localStorage.getItem(LOCAL_STORAGE_ORGS_KEY);
    if (storedOrgs) {
      try {
        const organizations: Organization[] = JSON.parse(storedOrgs);
        const org = organizations.find(o => o.id === orgId);
        if (org) {
            console.warn(`Fetching organization ${orgId} from localStorage (Firestore unavailable or offline, or server-side access failed).`);
            return org;
        }
      } catch (e) {
        console.error("Error parsing orgs from localStorage for getOrganizationById", e);
      }
    }
    console.warn(`Organization ${orgId} not found in localStorage cache.`);
    return undefined;
  }
  
  // Server-side and Firestore failed or not configured
  console.warn(`Organization ${orgId} not found. (Server-side context and Firestore is unavailable/not configured).`);
  return undefined;
}
