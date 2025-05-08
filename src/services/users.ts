
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, query, limit, where } from 'firebase/firestore';
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

const usersCollectionRef = collection(db, 'users');

// This seeding function is for demonstration.
async function seedInitialUsersIfEmpty() {
  try {
    const q = query(usersCollectionRef, where("username", "==", "admin")); // Check for a specific known user
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log("Firestore 'users' collection seems empty or key user 'admin' not found. Seeding initial users...");
      
      const usersToSeed: UserDoc[] = [
        { id: 'admin', username: 'admin', name: 'Administrator Portal', role: 'admin', company: 'Maximo Corp', phone: '555-0000', position: 'System Administrator' },
        { id: 'superuser', username: 'superuser', name: 'Super Usuario Portal', role: 'superuser', company: 'System Corp', phone: '555-9999', position: 'System Super User' },
        { id: 'client-tla1', username: 'client-tla1', name: 'Cliente TLA Primario', role: 'client', company: 'TLA', phone: '555-0101', position: 'Client User' },
        { id: 'client-fema1', username: 'client-fema1', name: 'Cliente FEMA Primario', role: 'client', company: 'FEMA', phone: '555-0202', position: 'Client User' },
        { id: 'client-generic1', username: 'client-generic1', name: 'Cliente Genérico Uno', role: 'client', company: 'Other Company', phone: '555-0303', position: 'Client User' },
        { id: 'client-tla2', username: 'client-tla2', name: 'Cliente TLA Secundario', role: 'client', company: 'TLA', phone: '555-0102', position: 'Client Contact' },
        { id: 'another-admin', username: 'another-admin', name: 'Técnico Secundario', role: 'admin', company: 'Maximo Corp', phone: '555-0001', position: 'Technician' },
        // Mock authors for GitHub commits (match names in github.ts mock data if they need to be users)
        { id: 'alice-wonderland', username: 'alice-wonderland', name: 'Alice Wonderland', role: 'admin', company: 'Maximo Corp', phone: 'N/A', position: 'Developer' },
        { id: 'bob-the-builder', username: 'bob-the-builder', name: 'Bob The Builder', role: 'admin', company: 'Maximo Corp', phone: 'N/A', position: 'Developer' },
      ];

      for (const userData of usersToSeed) {
        const { id, ...dataToStore } = userData; // Separate id from the data to store
        const userDocRef = doc(db, "users", id);
        await setDoc(userDocRef, dataToStore);
      }
      console.log("Initial users seeded to Firestore.");
      // Persist these mock users to localStorage for the mock login to find them
      localStorage.setItem('firestore_mock_users', JSON.stringify(usersToSeed.map(u => ({...u, id: u.username}))));

    }
  } catch (error) {
    console.error("Error during seeding check/process: ", error);
  }
}


/**
 * Asynchronously retrieves a list of users from Firestore.
 * @returns A promise that resolves to an array of UserDoc objects.
 */
export async function getUsers(): Promise<UserDoc[]> {
  await seedInitialUsersIfEmpty();
  await new Promise(resolve => setTimeout(resolve, 100)); 
  try {
    const querySnapshot = await getDocs(usersCollectionRef);
    const users: UserDoc[] = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() } as UserDoc);
    });
     // Persist to localStorage for mock login
    localStorage.setItem('firestore_mock_users', JSON.stringify(users));
    return users;
  } catch (error) {
    console.error("Error fetching users from Firestore: ", error);
    return [];
  }
}

/**
 * Asynchronously retrieves a user by their ID (username) from Firestore.
 * @param userId The ID (username) of the user.
 * @returns A promise that resolves to a UserDoc object or undefined if not found.
 */
export async function getUserById(userId: string): Promise<UserDoc | undefined> {
  await seedInitialUsersIfEmpty();
  await new Promise(resolve => setTimeout(resolve, 50));
  try {
    if (!userId) return undefined;
    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as UserDoc;
    } else {
      return undefined;
    }
  } catch (error) {
    console.error(`Error fetching user by ID (${userId}) from Firestore: `, error);
    return undefined;
  }
}

/**
 * Creates or updates a user in Firestore.
 * The document ID will be the user's username.
 * @param userData The user data to create or update. Matches AuthContextUserType.
 * @returns A promise that resolves to true if successful, false otherwise.
 */
export async function createUserInFirestore(userData: AuthContextUserType): Promise<boolean> {
  await seedInitialUsersIfEmpty();
  if (!userData.username) {
    console.error("Username is required to create a user in Firestore.");
    return false;
  }
  try {
    const { id, ...dataToStore } = userData; // `id` is typically username, Firestore uses its own doc ID
    const userDocRef = doc(db, "users", userData.username); // Use username as document ID
    await setDoc(userDocRef, dataToStore, { merge: true }); // Use merge to update if exists
    console.log(`User ${userData.username} created/updated in Firestore.`);
     // Update localStorage mock
    const existingUsersString = localStorage.getItem('firestore_mock_users');
    let existingUsers: UserDoc[] = existingUsersString ? JSON.parse(existingUsersString) : [];
    const userIndex = existingUsers.findIndex(u => u.id === userData.username);
    if (userIndex > -1) {
        existingUsers[userIndex] = { ...existingUsers[userIndex], ...dataToStore, id: userData.username, username: userData.username };
    } else {
        existingUsers.push({ ...dataToStore, id: userData.username, username: userData.username } as UserDoc);
    }
    localStorage.setItem('firestore_mock_users', JSON.stringify(existingUsers));
    return true;
  } catch (error) {
    console.error("Error creating/updating user in Firestore: ", error);
    return false;
  }
}

// Interface for organizations (companies)
export interface Organization {
  id: string; // Unique ID for the organization (e.g., company name normalized)
  name: string; // Display name of the company
  githubRepository?: string; // Associated GitHub repository URL or path
  // Add other organization-specific fields as needed
}

const organizationsCollectionRef = collection(db, 'organizations');

// Seed initial organizations if empty
async function seedInitialOrganizationsIfEmpty() {
    try {
        const q = query(organizationsCollectionRef, limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            console.log("Firestore 'organizations' collection is empty. Seeding initial organizations...");
            const orgsToSeed: Organization[] = [
                { id: 'tla', name: 'TLA', githubRepository: 'maximo-tla' },
                { id: 'fema', name: 'FEMA', githubRepository: 'maximo-fema' },
                { id: 'system-corp', name: 'System Corp' }, // For superuser
                { id: 'maximo-corp', name: 'Maximo Corp' }, // For admins
                { id: 'other-company', name: 'Other Company' },
            ];
            for (const orgData of orgsToSeed) {
                const orgDocRef = doc(db, "organizations", orgData.id);
                await setDoc(orgDocRef, orgData);
            }
            console.log("Initial organizations seeded to Firestore.");
        }
    } catch (error) {
        console.error("Error during organizations seeding: ", error);
    }
}

/**
 * Creates or updates an organization in Firestore.
 * @param orgData The organization data.
 * @returns A promise that resolves to true if successful, false otherwise.
 */
export async function createOrUpdateOrganization(orgData: Organization): Promise<boolean> {
    await seedInitialOrganizationsIfEmpty();
    if (!orgData.id || !orgData.name) {
        console.error("Organization ID and Name are required.");
        return false;
    }
    try {
        const orgDocRef = doc(db, "organizations", orgData.id);
        await setDoc(orgDocRef, orgData, { merge: true });
        console.log(`Organization ${orgData.name} created/updated in Firestore.`);
        return true;
    } catch (error) {
        console.error("Error creating/updating organization in Firestore: ", error);
        return false;
    }
}

/**
 * Retrieves all organizations from Firestore.
 * @returns A promise that resolves to an array of Organization objects.
 */
export async function getOrganizations(): Promise<Organization[]> {
    await seedInitialOrganizationsIfEmpty();
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
        const querySnapshot = await getDocs(organizationsCollectionRef);
        const organizations: Organization[] = [];
        querySnapshot.forEach((doc) => {
            organizations.push({ id: doc.id, ...doc.data() } as Organization);
        });
        return organizations;
    } catch (error) {
        console.error("Error fetching organizations from Firestore: ", error);
        return [];
    }
}

/**
 * Retrieves an organization by its ID from Firestore.
 * @param orgId The ID of the organization.
 * @returns A promise that resolves to an Organization object or undefined if not found.
 */
export async function getOrganizationById(orgId: string): Promise<Organization | undefined> {
    await seedInitialOrganizationsIfEmpty();
    await new Promise(resolve => setTimeout(resolve, 50));
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
