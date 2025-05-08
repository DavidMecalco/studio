
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, query, limit } from 'firebase/firestore';

/**
 * Represents a user in the system, as stored in Firestore.
 * The document ID in Firestore will be the user's username (e.g., "admin", "client-tla1").
 */
export interface User {
  id: string; // Corresponds to the document ID / username
  name: string; // Display name for the user
}

const usersCollectionRef = collection(db, 'users');

// This seeding function is for demonstration. In production, manage data via Firebase console or admin scripts.
let initialDataSeeded = false;
async function seedInitialUsersIfEmpty() {
  if (initialDataSeeded) return;

  try {
    const q = query(usersCollectionRef, limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log("Firestore 'users' collection is empty. Seeding initial users...");
      
      const usersToSeed: { id: string; name: string }[] = [
        // Role-based users (match IDs in AuthContext)
        { id: 'admin', name: 'Administrator Portal' },
        { id: 'superuser', name: 'Super Usuario Portal' },
        { id: 'client-tla1', name: 'Cliente TLA Primario' },
        { id: 'client-fema1', name: 'Cliente FEMA Primario' },
        { id: 'client-generic1', name: 'Cliente Genérico Uno' },
        { id: 'client-tla2', name: 'Cliente TLA Secundario' },
        { id: 'another-admin', name: 'Técnico Secundario' },
        // Mock authors for GitHub commits (match names in github.ts mock data)
        { id: 'alice-wonderland', name: 'Alice Wonderland' },
        { id: 'bob-the-builder', name: 'Bob The Builder' },
        { id: 'charlie-brown', name: 'Charlie Brown' },
        { id: 'diana-prince', name: 'Diana Prince' },
        { id: 'edward-scissorhands', name: 'Edward Scissorhands' },
        { id: 'fiona-gallagher', name: 'Fiona Gallagher' },
      ];

      for (const userData of usersToSeed) {
        const userDocRef = doc(db, "users", userData.id);
        // Firestore document will have 'name' field. 'id' is the document key.
        await setDoc(userDocRef, { name: userData.name });
      }
      console.log("Initial users seeded to Firestore.");
    }
    initialDataSeeded = true; // Mark as attempted/checked
  } catch (error) {
    console.error("Error during seeding check/process: ", error);
    // Decide if initialDataSeeded should be true even on error to prevent re-attempts
    initialDataSeeded = true; 
  }
}


/**
 * Asynchronously retrieves a list of users from Firestore.
 * @returns A promise that resolves to an array of User objects.
 */
export async function getUsers(): Promise<User[]> {
  await seedInitialUsersIfEmpty(); // Ensure data is there for demo
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100)); 
  try {
    const querySnapshot = await getDocs(usersCollectionRef);
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      // Construct User object with id from doc.id and name from doc.data()
      users.push({ id: doc.id, ...doc.data() } as User);
    });
    return users;
  } catch (error) {
    console.error("Error fetching users from Firestore: ", error);
    return []; // Return empty array on error
  }
}

/**
 * Asynchronously retrieves a user by their ID (username) from Firestore.
 * @param userId The ID (username) of the user.
 * @returns A promise that resolves to a User object or undefined if not found.
 */
export async function getUserById(userId: string): Promise<User | undefined> {
  await seedInitialUsersIfEmpty(); // Ensure data is there for demo
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 50));
  try {
    if (!userId) return undefined; // Handle case where userId might be empty or null
    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    } else {
      // console.log(`No such user document in Firestore for ID: ${userId}`);
      return undefined;
    }
  } catch (error) {
    console.error(`Error fetching user by ID (${userId}) from Firestore: `, error);
    return undefined;
  }
}
