/**
 * Represents a user in the system.
 */
export interface User {
  id: string;
  name: string;
  // email?: string; // Optional: if needed later
}

const mockUsers: User[] = [
  { id: 'user-1', name: 'Alice Wonderland' },
  { id: 'user-2', name: 'Bob The Builder' },
  { id: 'user-3', name: 'Charlie Brown' },
  { id: 'user-4', name: 'Diana Prince' },
  { id: 'user-5', name: 'Edward Scissorhands' },
];

/**
 * Asynchronously retrieves a list of users.
 * @returns A promise that resolves to an array of User objects.
 */
export async function getUsers(): Promise<User[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  return JSON.parse(JSON.stringify(mockUsers)); // Return a deep copy
}

/**
 * Asynchronously retrieves a user by their ID.
 * @param userId The ID of the user.
 * @returns A promise that resolves to a User object or undefined if not found.
 */
export async function getUserById(userId: string): Promise<User | undefined> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return mockUsers.find(user => user.id === userId);
}