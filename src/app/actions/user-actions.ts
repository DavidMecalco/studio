
"use server";

import { revalidatePath } from "next/cache";
import { 
  createUserInFirestore as createUserInFirestoreService, 
  createOrUpdateOrganization as createOrUpdateOrganizationService,
  type UserDoc,
  type Organization
} from "@/services/users";
import type { User as AuthUserType } from "@/context/auth-context"; // For consistency with form data type

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
  userData: AuthUserType // Using AuthUserType as it's what forms might pass directly
): Promise<CreateUserResult> {
  if (!userData.username || !userData.name || !userData.role) {
    return { success: false, error: "Username, name, and role are required." };
  }

  try {
    const success = await createUserInFirestoreService(userData);
    if (success) {
      revalidatePath("/(app)/user-management", "page");
      // Retrieve the user to return it - note: createUserInFirestoreService needs to return the user or we fetch it
      // For simplicity, we are not returning the full UserDoc here but in a real app you might.
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
    const success = await createOrUpdateOrganizationService(orgData);
    if (success) {
      revalidatePath("/(app)/organization-management", "page");
      // Similar to user, we might want to return the created/updated org
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
