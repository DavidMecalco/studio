
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

if (isFirebaseProperlyConfigured && db) {
  usersCollectionRef = collection(db, 'users');
  organizationsCollectionRef = collection(db, 'organizations');
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
    // For server-side (e.g. during build or server actions without full client env)
    // We cannot rely on localStorage.
    // If Firestore is not properly configured, service calls will gracefully degrade or log errors.
    if (!isFirebaseProperlyConfigured) {
        console.warn("Mock data seeding: Firebase not properly configured for server-side context. Operations will rely on direct Firebase access if available, or fail if not.");
    }
    // No actual seeding to localStorage can happen here.
    return;
  }

  // Client-side seeding logic
  if (localStorage.getItem(MOCK_DATA_SEEDED_FLAG_V5) === 'true' && isFirebaseProperlyConfigured && db) {
    try {
        if (usersCollectionRef) {
            const adminDoc = await getDoc(doc(usersCollectionRef, 'admin'));
            if (adminDoc.exists()) { 
              if (organizationsCollectionRef) {
                const tlaOrgDoc = await getDoc(doc(organizationsCollectionRef, 'tla'));
                if (tlaOrgDoc.exists()) {
                  return; // Both users and orgs seem seeded in Firestore
                }
              } else if (!organizationsCollectionRef) { // Orgs collection doesn't exist, but users do
                 return; // Still consider users seeded
              }
            }
        } else if (!usersCollectionRef && organizationsCollectionRef) { // Users collection doesn't exist, but orgs do
            const tlaOrgDoc = await getDoc(doc(organizationsCollectionRef, 'tla'));
            if (tlaOrgDoc.exists()) return; // Consider orgs seeded
        } else if (!usersCollectionRef && !organizationsCollectionRef && isFirebaseProperlyConfigured){
            // Firestore is configured but collections don't exist, implies not seeded yet.
        } else if (!isFirebaseProperlyConfigured) {
             // If Firebase is not configured, the localStorage flag is the source of truth
             return;
        }
    } catch (e) {
        console.warn("Error checking Firestore seed status (client might be offline or other Firestore issue). Relying on localStorage flag if set.", e);
        if (localStorage.getItem(MOCK_DATA_SEEDED_FLAG_V5) === 'true') return;
    }
  }


  console.log("Attempting to seed initial mock data (v5)...");

  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(usersToSeed));
  localStorage.setItem(LOCAL_STORAGE_ORGS_KEY, JSON.stringify(orgsToSeed));
  console.log("Mock data (v5) seeded to localStorage.");

  if (isFirebaseProperlyConfigured && db && navigator.onLine && (usersCollectionRef || organizationsCollectionRef)) {
    try {
      const batch = writeBatch(db);
      let firestoreNeedsSeeding = false;

      // Check and seed users
      if (usersCollectionRef) {
        const adminUserDocSnap = await getDoc(doc(usersCollectionRef, "admin"));
        if (!adminUserDocSnap.exists()) {
          firestoreNeedsSeeding = true;
          console.log("Preparing to seed users to Firestore (v5)...");
          for (const userData of usersToSeed) {
            const { id, ...dataToSeed } = userData; 
            batch.set(doc(usersCollectionRef, id), dataToSeed);
          }
        }
      }

      // Check and seed organizations
      if (organizationsCollectionRef) {
        const tlaOrgDocSnap = await getDoc(doc(organizationsCollectionRef, "tla"));
        if (!tlaOrgDocSnap.exists()) {
          firestoreNeedsSeeding = true;
          console.log("Preparing to seed organizations to Firestore (v5)...");
          for (const orgData of orgsToSeed) {
             const { id, ...dataToSeed } = orgData; 
            batch.set(doc(organizationsCollectionRef, id), dataToSeed);
          }
        }
      }
      

      if (firestoreNeedsSeeding) {
        await batch.commit();
        console.log("Initial data (v5) committed to Firestore.");
      } else {
        console.log("Firestore already contains key mock data (v5) or collections not available. Skipping Firestore seed part if applicable.");
      }
    } catch (error) {
      console.warn("Error during Firestore seeding (v5) (client might be offline or other Firestore issue): ", error);
    }
  } else {
    let reason = "";
    if (!isFirebaseProperlyConfigured) reason += "Firebase not properly configured. ";
    if (!db) reason += "Firestore db instance is null. ";
    if (typeof navigator !== 'undefined' && !navigator.onLine) reason += "Client is offline. ";
    if (!usersCollectionRef && !organizationsCollectionRef) reason += "Users and Organizations collection references are null. ";
    else if (!usersCollectionRef) reason += "Users collection reference is null. ";
    else if (!organizationsCollectionRef) reason += "Organizations collection reference is null. ";
    
    console.log(`Skipping Firestore seeding operations (v5). ${reason}Will rely on localStorage.`);
  }

  localStorage.setItem(MOCK_DATA_SEEDED_FLAG_V5, 'true');
  console.log("Mock data seeding process (v5) complete. Seeding flag set.");
}


export async function getUsers(): Promise<UserDoc[]> {
  await ensureMockDataSeeded();
  // Short delay to simulate network latency, if desired for testing UX
  // await new Promise(resolve => setTimeout(resolve, 20)); 

  if (isFirebaseProperlyConfigured && db && usersCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      console.log("Fetching users from Firestore.");
      const querySnapshot = await getDocs(usersCollectionRef);
      const users: UserDoc[] = [];
      querySnapshot.forEach((docSnap) => {
        users.push({ id: docSnap.id, ...docSnap.data() } as UserDoc);
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
      }
      return users;
    } catch (error) {
      console.error("Error fetching users from Firestore, falling back to localStorage if available: ", error);
    }
  }

  if (typeof window !== 'undefined') {
    const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (storedUsers) {
      try {
        console.warn("Fetching users from localStorage (Firestore unavailable or offline).");
        return JSON.parse(storedUsers);
      } catch (e) {
        console.error("Error parsing users from localStorage.", e);
        return [];
      }
    }
  }
  console.warn("No users found in Firestore or localStorage.");
  return [];
}

export async function getUserById(userId: string): Promise<UserDoc | undefined> {
  await ensureMockDataSeeded();
  // await new Promise(resolve => setTimeout(resolve, 10));

  if (isFirebaseProperlyConfigured && db && usersCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      if (!userId) return undefined;
      const userDocRef = doc(usersCollectionRef, userId);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const userData = { id: docSnap.id, ...docSnap.data() } as UserDoc;
        if (typeof window !== 'undefined') { // Update localStorage cache
            const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
            let users: UserDoc[] = storedUsers ? JSON.parse(storedUsers) : [];
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex > -1) users[userIndex] = userData; else users.push(userData);
            localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
        }
        return userData;
      }
    } catch (error) {
      console.error(`Error fetching user by ID (${userId}) from Firestore, falling back to localStorage: `, error);
    }
  }
  
  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (storedUsers) {
      try {
        const users: UserDoc[] = JSON.parse(storedUsers);
        const user = users.find(u => u.id === userId);
        if (user) {
            console.warn(`Fetching user ${userId} from localStorage (Firestore unavailable or offline).`);
            return user;
        }
      } catch (e) {
        console.error("Error parsing users from localStorage for getUserById", e);
      }
    }
  }
  console.warn(`User ${userId} not found in Firestore or localStorage.`);
  return undefined;
}


export async function createUserInFirestoreService(userData: AuthContextUserType): Promise<boolean> {
  if (!userData.id || !userData.username || !userData.email || !userData.password) {
    console.error("ID, Username, email, and password are required to create/update a user.");
    return false;
  }
  
  if (!isFirebaseProperlyConfigured || !db || !usersCollectionRef) {
    const errorMessage = `Cannot create/update user ${userData.username}: Firebase not properly configured or db/usersCollectionRef is null.`;
    if (typeof window !== 'undefined') {
      console.warn(`${errorMessage} Attempting localStorage update only.`);
      try {
          const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
          let users: UserDoc[] = storedUsers ? JSON.parse(storedUsers) : [];
          const userIndex = users.findIndex(u => u.id === userData.id);
          const userToStore: UserDoc = { ...userData, password: userData.password! }; 
          if (userIndex > -1) users[userIndex] = userToStore; else users.push(userToStore);
          localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
          console.log(`User ${userToStore.username} (email: ${userToStore.email}) created/updated in localStorage only.`);
          return true;
      } catch (e) {
          console.error("Error updating localStorage for user:", e);
          return false;
      }
    } else {
      console.error(`${errorMessage} Not in browser environment, cannot use localStorage fallback for server action.`);
      return false;
    }
  }

  try {
    const userDocRef = doc(usersCollectionRef, userData.id);
    // Do not spread userData.id into Firestore document data if ID is the doc key
    const { id, ...dataForFirestore } = userData; 
    await setDoc(userDocRef, dataForFirestore, { merge: true });
    console.log(`User ${userData.username} (email: ${userData.email}) created/updated in Firestore.`);
    
    // Update localStorage cache after successful Firestore operation
    if (typeof window !== 'undefined') {
        const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
        let users: UserDoc[] = storedUsers ? JSON.parse(storedUsers) : [];
        const userIndex = users.findIndex(u => u.id === userData.id);
        const userToCache: UserDoc = { ...userData, password: userData.password! };
        if (userIndex > -1) users[userIndex] = userToCache; else users.push(userToCache);
        localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
    }
    return true;
  } catch (error) {
    console.error("Error creating/updating user in Firestore: ", error);
    return false;
  }
}


export async function getOrganizations(): Promise<Organization[]> {
  await ensureMockDataSeeded();
  // await new Promise(resolve => setTimeout(resolve, 20));

  if (isFirebaseProperlyConfigured && db && organizationsCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      console.log("Fetching organizations from Firestore.");
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
      console.error("Error fetching organizations from Firestore, falling back to localStorage if available: ", error);
    }
  }

  if (typeof window !== 'undefined') {
    const storedOrgs = localStorage.getItem(LOCAL_STORAGE_ORGS_KEY);
    if (storedOrgs) {
      try {
        console.warn("Fetching organizations from localStorage (Firestore unavailable or offline).");
        return JSON.parse(storedOrgs);
      } catch (e) {
        console.error("Error parsing organizations from localStorage.", e);
        return [];
      }
    }
  }
  console.warn("No organizations found in Firestore or localStorage.");
  return [];
}

export async function createOrUpdateOrganization(orgData: Organization): Promise<boolean> {
  if (!orgData.id || !orgData.name) {
    console.error("Organization ID and Name are required.");
    return false;
  }

  if (!isFirebaseProperlyConfigured || !db || !organizationsCollectionRef) {
    const errorMessage = `Cannot create/update organization ${orgData.name}: Firebase not properly configured or db/organizationsCollectionRef is null.`;
    if (typeof window !== 'undefined') { // Server actions run on the server
       console.warn(`${errorMessage} Attempting localStorage update only.`);
        try {
            const storedOrgs = localStorage.getItem(LOCAL_STORAGE_ORGS_KEY);
            let organizations: Organization[] = storedOrgs ? JSON.parse(storedOrgs) : [];
            const orgIndex = organizations.findIndex(o => o.id === orgData.id);
            if (orgIndex > -1) organizations[orgIndex] = orgData; else organizations.push(orgData);
            localStorage.setItem(LOCAL_STORAGE_ORGS_KEY, JSON.stringify(organizations));
            console.log(`Organization ${orgData.name} created/updated in localStorage only.`);
            return true;
        } catch (e) {
            console.error("Error updating localStorage for organization:", e);
            return false;
        }
    } else {
        console.error(`${errorMessage} Not in browser environment, cannot use localStorage fallback for server action.`);
        return false; 
    }
  }

  try {
    const orgDocRef = doc(organizationsCollectionRef, orgData.id);
    const { id, ...dataForFirestore } = orgData; // Exclude id from data if it's the doc key
    await setDoc(orgDocRef, dataForFirestore, { merge: true });
    console.log(`Organization ${orgData.name} created/updated in Firestore.`);
    
    if (typeof window !== 'undefined') { // Update localStorage cache
        const storedOrgs = localStorage.getItem(LOCAL_STORAGE_ORGS_KEY);
        let organizations: Organization[] = storedOrgs ? JSON.parse(storedOrgs) : [];
        const orgIndex = organizations.findIndex(o => o.id === orgData.id);
        if (orgIndex > -1) organizations[orgIndex] = orgData; else organizations.push(orgData);
        localStorage.setItem(LOCAL_STORAGE_ORGS_KEY, JSON.stringify(organizations));
    }
    return true;
  } catch (error) {
    console.error("Error creating/updating organization in Firestore: ", error);
    // Fallback to localStorage if Firestore operation fails (client-side only)
    if (typeof window !== 'undefined') {
        try {
            const storedOrgs = localStorage.getItem(LOCAL_STORAGE_ORGS_KEY);
            let organizations: Organization[] = storedOrgs ? JSON.parse(storedOrgs) : [];
            const orgIndex = organizations.findIndex(o => o.id === orgData.id);
            if (orgIndex > -1) organizations[orgIndex] = orgData; else organizations.push(orgData);
            localStorage.setItem(LOCAL_STORAGE_ORGS_KEY, JSON.stringify(organizations));
            console.warn(`Organization ${orgData.name} created/updated in localStorage only due to Firestore error.`);
            return true; 
        } catch (e) {
            console.error("Error updating localStorage for organization after Firestore failure:", e);
            return false; 
        }
    }
    return false; 
  }
}

export async function getOrganizationById(orgId: string): Promise<Organization | undefined> {
  await ensureMockDataSeeded();
  // await new Promise(resolve => setTimeout(resolve, 10));

  if (isFirebaseProperlyConfigured && db && organizationsCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      if (!orgId) return undefined;
      const orgDocRef = doc(organizationsCollectionRef, orgId);
      const docSnap = await getDoc(orgDocRef);
      if (docSnap.exists()) {
         const orgData = { id: docSnap.id, ...docSnap.data() } as Organization;
        if (typeof window !== 'undefined') { // Update localStorage cache
            const storedOrgs = localStorage.getItem(LOCAL_STORAGE_ORGS_KEY);
            let orgs: Organization[] = storedOrgs ? JSON.parse(storedOrgs) : [];
            const orgIndex = orgs.findIndex(o => o.id === orgId);
            if (orgIndex > -1) orgs[orgIndex] = orgData; else orgs.push(orgData);
            localStorage.setItem(LOCAL_STORAGE_ORGS_KEY, JSON.stringify(orgs));
        }
        return orgData;
      }
    } catch (error) {
      console.error(`Error fetching organization by ID (${orgId}) from Firestore, falling back to localStorage: `, error);
    }
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const storedOrgs = localStorage.getItem(LOCAL_STORAGE_ORGS_KEY);
    if (storedOrgs) {
      try {
        const organizations: Organization[] = JSON.parse(storedOrgs);
        const org = organizations.find(o => o.id === orgId);
        if (org) {
            console.warn(`Fetching organization ${orgId} from localStorage (Firestore unavailable or offline).`);
            return org;
        }
      } catch (e) {
        console.error("Error parsing orgs from localStorage for getOrganizationById", e);
      }
    }
  }
  console.warn(`Organization ${orgId} not found in Firestore or localStorage.`);
  return undefined;
}

