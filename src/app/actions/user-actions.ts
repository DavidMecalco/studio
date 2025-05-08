
"use server";

import { revalidatePath } from "next/cache";
import { 
  createUserInFirestore as createUserInFirestoreService, 
  createOrUpdateOrganization as createOrUpdateOrganizationService,
  type UserDoc,
  type Organization,
  getUserById
} from "@/services/users";
import type { User as AuthUserType } from "@/context/auth-context"; 

interface CreateUserResult {
  success: boolean;
  user?: UserDoc;
  error?: string;
}

/**
 * Server action to create or update a user in Firestore.
 * @param userData The data for the user.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function createOrUpdateUserAction(
  userData: AuthUserType 
): Promise<CreateUserResult> {
  if (!userData.username || !userData.name || !userData.role || !userData.email || !userData.password) {
    return { success: false, error: "Username, name, email, password and role are required." };
  }

  try {
    const isEditing = !!userData.id; // If ID exists, we are editing
    const success = await createUserInFirestoreService(userData);
    if (success) {
      revalidatePath("/(app)/user-management", "page");
      
      // Simulate Email Notification
      const superUser = await getUserById('superuser'); // Assuming 'superuser' is the ID of the superuser
      const actionText = isEditing ? 'updated' : 'created';
      const notificationMessage = `User account for ${userData.email} has been ${actionText}. Details: Username: ${userData.username}, Role: ${userData.role}.`;
      
      // Notify the created/updated user
      console.log(`Simulated Email Notification to ${userData.email}: Your account has been ${actionText}. Username: ${userData.username}, Role: ${userData.role}. Login with the provided password.`);
      
      // Notify the superuser who performed the action
      if (superUser?.email && superUser.email !== userData.email) { // Don't notify superuser if they are editing their own account
          console.log(`Simulated Email Notification to Super User (${superUser.email}): ${notificationMessage}`);
      }

      return { success: true }; 
    } else {
      return { success: false, error: "Failed to create or update user in Firestore." };
    }
  } catch (error) {
    console.error("Error in createOrUpdateUserAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred.";
    return { success: false, error: errorMessage };
  }
}


interface CreateOrganizationResult {
  success: boolean;
  organization?: Organization;
  error?: string;
}

/**
 * Server action to create or update an organization in Firestore.
 * @param orgData The data for the organization.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function createOrUpdateOrganizationAction(
  orgData: Organization
): Promise<CreateOrganizationResult> {
  if (!orgData.id || !orgData.name) {
    return { success: false, error: "Organization ID (slug) and name are required." };
  }

  try {
    const isEditing = !!(await getOrganizationById(orgData.id)); // Check if org exists before update
    const success = await createOrUpdateOrganizationService(orgData);
    if (success) {
      revalidatePath("/(app)/organization-management", "page");
      
      // Simulate Email Notification
      const superUser = await getUserById('superuser'); 
      const actionText = isEditing ? 'updated' : 'created';
      const notificationMessage = `Organization '${orgData.name}' (ID: ${orgData.id}) has been ${actionText}.`;
       if (superUser?.email) {
          console.log(`Simulated Email Notification to Super User (${superUser.email}): ${notificationMessage}`);
      }
      
      return { success: true, organization: orgData };
    } else {
      return { success: false, error: "Failed to create or update organization in Firestore." };
    }
  } catch (error) {
    console.error("Error in createOrUpdateOrganizationAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred.";
    return { success: false, error: errorMessage };
  }
}
