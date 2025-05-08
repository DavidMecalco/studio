"use server";

import { revalidatePath } from "next/cache";
import {
  createUserInFirestoreService, 
  createOrUpdateOrganization as createOrUpdateOrganizationService,
  type UserDoc,
  type Organization,
  getUserById,
  getOrganizationById
} from "@/services/users";
import type { User as AuthUserType } from "@/context/auth-context";
import { isFirebaseProperlyConfigured } from "@/lib/firebase"; 

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

  // The service layer (createUserInFirestoreService) will handle checks for 
  // Firebase configuration and attempt localStorage fallback if appropriate (client-side).
  // For server actions, localStorage fallback isn't possible.

  try {
    const isEditing = !!userData.id;
    const success = await createUserInFirestoreService(userData); 
    if (success) {
      revalidatePath("/(app)/user-management", "page");

      const actionText = isEditing ? 'updated' : 'created';

      // Notify the created/updated user
      console.log(`Simulated Email Notification to ${userData.email}: Your account has been ${actionText}. Username: ${userData.username}, Role: ${userData.role}. Login with the provided password.`);

      // Notify the superuser who performed the action
      // This check needs to be inside the success block and after ensuring Firebase might be available for getUserById
      if (isFirebaseProperlyConfigured) { 
        const superUser = await getUserById('superuser'); 
        if (superUser?.email && superUser.email !== userData.email) { 
          const notificationMessage = `User account for ${userData.email} has been ${actionText}. Details: Username: ${userData.username}, Role: ${userData.role}.`;
          console.log(`Simulated Email Notification to Super User (${superUser.email}): ${notificationMessage}`);
        }
      } else {
        console.log("Skipped superuser notification for user action as Firebase is not properly configured.");
      }
      
      return { success: true, user: userData as UserDoc };
    } else {
      return { success: false, error: "Failed to create or update user. Check server logs for details (e.g., Firebase configuration or Firestore access issues)." };
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

  // The service layer (createOrUpdateOrganizationService) will handle checks for
  // Firebase configuration. Server actions cannot use localStorage fallback.

  try {
    const existingOrg = await getOrganizationById(orgData.id); // This service call also handles Firebase/localStorage logic
    const isEditing = !!existingOrg;
    const success = await createOrUpdateOrganizationService(orgData);
    if (success) {
      revalidatePath("/(app)/organization-management", "page");

      const actionText = isEditing ? 'updated' : 'created';
      const notificationMessage = `Organization '${orgData.name}' (ID: ${orgData.id}) has been ${actionText}.`;

      if (isFirebaseProperlyConfigured) {
        const superUser = await getUserById('superuser');
        if (superUser?.email) {
            console.log(`Simulated Email Notification to Super User (${superUser.email}): ${notificationMessage}`);
        }
      } else {
         console.log("Skipped superuser notification for organization action as Firebase is not properly configured.");
      }

      return { success: true, organization: orgData };
    } else {
      return { success: false, error: "Failed to create or update organization. Check server logs for details (e.g., Firebase configuration or Firestore access issues)." };
    }
  } catch (error) {
    console.error("Error in createOrUpdateOrganizationAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred.";
    return { success: false, error: errorMessage };
  }
}

