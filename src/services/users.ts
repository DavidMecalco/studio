
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, query, where } from 'firebase/firestore';
import type { User as AuthContextUserType } from '@/context/auth-context'; // Import for type consistency

/**
 * Represents a user document in Firestore.
 * The document ID in Firestore will be the user's username.
 */
export interface UserDoc {
  id: string; // Corresponds to the document ID / username
  username: string;
  name: string; // Display name for the user
  role: 'admin' | 'client' | 'superuser';
  company?: string;
  phone?: string;
  position?: string;
}

// Interface for organizations (companies)
export interface Organization {
  id: string; // Unique ID for the organization (e.g., company name normalized)
  name: string; // Display name of the company
  githubRepository?: string; // Associated GitHub repository URL or path
}

const usersCollectionRef = collection(db, 'users');
const organizationsCollectionRef = collection(db, 'organizations');

const MOCK_DATA_SEEDED_FLAG_V3 = 'mock_data_seeded_v3';
const LOCAL_STORAGE_USERS_KEY = 'firestore_mock_users';
const LOCAL_STORAGE_ORGS_KEY = 'firestore_mock_orgs';

const usersToSeed: UserDoc[] = [
  { id: 'admin', username: 'admin', name: 'Administrator Portal', role: 'admin', company: 'Maximo Corp', phone: '555-0000', position: 'System Administrator' },
  { id: 'superuser', username: 'superuser', name: 'Super Usuario Portal', role: 'superuser', company: 'System Corp', phone: '555-9999', position: 'System Super User' },
  { id: 'client-tla1', username: 'client-tla1', name: 'Cliente TLA Primario', role: 'client', company: 'TLA', phone: '555-0101', position: 'Client User' },
  { id: 'client-fema1', username: 'client-fema1', name: 'Cliente FEMA Primario', role: 'client', company: 'FEMA', phone: '555-0202', position: 'Client User' },
  { id: 'client-generic1', username: 'client-generic1', name: 'Cliente Genérico Uno', role: 'client', company: 'Other Company', phone: '555-0303', position: 'Client User' },
  { id: 'client-tla2', username: 'client-tla2', name: 'Cliente TLA Secundario', role: 'client', company: 'TLA', phone: '555-0102', position: 'Client Contact' },
  { id: 'another-admin', username: 'another-admin', name: 'Técnico Secundario', role: 'admin', company: 'Maximo Corp', phone: '555-0001', position: 'Technician' },
  { id: 'alice-wonderland', username: 'alice-wonderland', name: 'Alice Wonderland', role: 'admin', company: 'Maximo Corp', phone: 'N/A', position: 'Developer' },
  { id: 'bob-the-builder', username: 'bob-the-builder', name: 'Bob The Builder', role: 'admin', company: 'Maximo Corp', phone: 'N/A', position: 'Developer' },
];

const orgsToSeed: Organization[] = [
  { id: 'tla', name: 'TLA', githubRepository: 'maximo-tla' },
  { id: 'fema', name: 'FEMA', githubRepository: 'maximo-fema' },
  { id: 'system-corp', name: 'System Corp' },
  { id: 'maximo-corp', name: 'Maximo Corp' },
  { id: 'other-company', name: 'Other Company', githubRepository: 'maximo-generic' },
];

async function ensureMockDataSeeded(): Promise<void> {
  if (typeof window === 'undefined' || localStorage.getItem(MOCK_DATA_SEEDED_FLAG_V3) === 'true') {
    return;
  }

  console.log("Seeding initial mock data to localStorage and Firestore...");

  try {
    // Seed users to localStorage
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(usersToSeed));
    // Seed organizations to localStorage
    localStorage.setItem(LOCAL_STORAGE_ORGS_KEY, JSON.stringify(orgsToSeed));

    // Attempt to seed Firestore only if it appears empty (check one user and one org)
    const adminUserDoc = await getDoc(doc(db, "users", "admin"));
    if (!adminUserDoc.exists()) {
      for (const userData of usersToSeed) {
        const { id, ...dataToStore } = userData;
        await setDoc(doc(db, "users", id), dataToStore);
      }
      console.log("Initial users seeded to Firestore.");
    }

    const tlaOrgDoc = await getDoc(doc(db, "organizations", "tla"));
    if (!tlaOrgDoc.exists()) {
      for (const orgData of orgsToSeed) {
        await setDoc(doc(db, "organizations", orgData.id), orgData);
      }
      console.log("Initial organizations seeded to Firestore.");
    }

    localStorage.setItem(MOCK_DATA_SEEDED_FLAG_V3, 'true');
    console.log("Mock data seeding complete.");
  } catch (error) {
    console.error("Error during mock data seeding: ", error);
    // Don't set the flag if seeding failed, so it can be retried.
  }
}


/**
 * Asynchronously retrieves a list of users.
 * Prioritizes localStorage for speed in mock environment after initial seed.
 * @returns A promise that resolves to an array of UserDoc objects.
 */
export async function getUsers(): Promise<UserDoc[]> {
  await ensureMockDataSeeded();
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate small delay

  const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
  if (storedUsers) {
    try {
      return JSON.parse(storedUsers);
    } catch (e) {
      console.error("Error parsing users from localStorage", e);
      // Fallback to Firestore if localStorage is corrupted
    }
  }

  // Fallback or initial load from Firestore
  try {
    const querySnapshot = await getDocs(usersCollectionRef);
    const users: UserDoc[] = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() } as UserDoc);
    });
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users)); // Cache fetched users
    return users;
  } catch (error) {
    console.error("Error fetching users from Firestore: ", error);
    return [];
  }
}

/**
 * Asynchronously retrieves a user by their ID (username).
 * Prioritizes localStorage.
 * @param userId The ID (username) of the user.
 * @returns A promise that resolves to a UserDoc object or undefined if not found.
 */
export async function getUserById(userId: string): Promise<UserDoc | undefined> {
  await ensureMockDataSeeded();
  await new Promise(resolve => setTimeout(resolve, 20));

  const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
  if (storedUsers) {
    try {
      const users: UserDoc[] = JSON.parse(storedUsers);
      const user = users.find(u => u.id === userId);
      if (user) return user;
    } catch (e) {
      console.error("Error parsing users from localStorage for getUserById", e);
    }
  }
  
  // Fallback to Firestore
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

/**
 * Creates or updates a user in Firestore and localStorage.
 * @param userData The user data to create or update.
 * @returns A promise that resolves to true if successful, false otherwise.
 */
export async function createUserInFirestore(userData: AuthContextUserType): Promise<boolean> {
  await ensureMockDataSeeded();
  if (!userData.username) {
    console.error("Username is required to create a user.");
    return false;
  }
  try {
    // Firestore update
    const { id, ...dataToStore } = userData;
    const userDocRef = doc(db, "users", userData.username);
    await setDoc(userDocRef, dataToStore, { merge: true });

    // Update localStorage cache
    const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    let users: UserDoc[] = storedUsers ? JSON.parse(storedUsers) : [];
    const userIndex = users.findIndex(u => u.id === userData.username);
    const userToCache: UserDoc = { ...dataToStore, id: userData.username, username: userData.username } as UserDoc;

    if (userIndex > -1) {
      users[userIndex] = userToCache;
    } else {
      users.push(userToCache);
    }
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
    
    console.log(`User ${userData.username} created/updated.`);
    return true;
  } catch (error) {
    console.error("Error creating/updating user: ", error);
    return false;
  }
}


/**
 * Retrieves all organizations.
 * Prioritizes localStorage for speed.
 * @returns A promise that resolves to an array of Organization objects.
 */
export async function getOrganizations(): Promise<Organization[]> {
  await ensureMockDataSeeded();
  await new Promise(resolve => setTimeout(resolve, 50));

  const storedOrgs = localStorage.getItem(LOCAL_STORAGE_ORGS_KEY);
  if (storedOrgs) {
    try {
      return JSON.parse(storedOrgs);
    } catch (e) {
      console.error("Error parsing organizations from localStorage", e);
    }
  }

  // Fallback or initial load from Firestore
  try {
    const querySnapshot = await getDocs(organizationsCollectionRef);
    const organizations: Organization[] = [];
    querySnapshot.forEach((doc) => {
      organizations.push({ id: doc.id, ...doc.data() } as Organization);
    });
    localStorage.setItem(LOCAL_STORAGE_ORGS_KEY, JSON.stringify(organizations)); // Cache
    return organizations;
  } catch (error) {
    console.error("Error fetching organizations from Firestore: ", error);
    return [];
  }
}

/**
 * Creates or updates an organization in Firestore and localStorage.
 * @param orgData The organization data.
 * @returns A promise that resolves to true if successful, false otherwise.
 */
export async function createOrUpdateOrganization(orgData: Organization): Promise<boolean> {
  await ensureMockDataSeeded();
  if (!orgData.id || !orgData.name) {
    console.error("Organization ID and Name are required.");
    return false;
  }
  try {
    // Firestore update
    const orgDocRef = doc(db, "organizations", orgData.id);
    await setDoc(orgDocRef, orgData, { merge: true });

    // Update localStorage cache
    const storedOrgs = localStorage.getItem(LOCAL_STORAGE_ORGS_KEY);
    let organizations: Organization[] = storedOrgs ? JSON.parse(storedOrgs) : [];
    const orgIndex = organizations.findIndex(o => o.id === orgData.id);
    if (orgIndex > -1) {
      organizations[orgIndex] = orgData;
    } else {
      organizations.push(orgData);
    }
    localStorage.setItem(LOCAL_STORAGE_ORGS_KEY, JSON.stringify(organizations));

    console.log(`Organization ${orgData.name} created/updated.`);
    return true;
  } catch (error) {
    console.error("Error creating/updating organization: ", error);
    return false;
  }
}

/**
 * Retrieves an organization by its ID.
 * Prioritizes localStorage.
 * @param orgId The ID of the organization.
 * @returns A promise that resolves to an Organization object or undefined if not found.
 */
export async function getOrganizationById(orgId: string): Promise<Organization | undefined> {
  await ensureMockDataSeeded();
  await new Promise(resolve => setTimeout(resolve, 20));

  const storedOrgs = localStorage.getItem(LOCAL_STORAGE_ORGS_KEY);
  if (storedOrgs) {
    try {
      const organizations: Organization[] = JSON.parse(storedOrgs);
      const org = organizations.find(o => o.id === orgId);
      if (org) return org;
    } catch (e) {
      console.error("Error parsing orgs from localStorage for getOrganizationById", e);
    }
  }

  // Fallback to Firestore
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
