
"use server";

import type { MaximoConfiguration} from "@/services/maximo";
import { uploadMaximoConfiguration } from "@/services/maximo";

export async function uploadMaximoConfigurationAction(
  configuration: MaximoConfiguration
): Promise<{ success: boolean; error?: string }> {
  try {
    const success = await uploadMaximoConfiguration(configuration);
    if (success) {
      return { success: true };
    } else {
      return { success: false, error: "Maximo API returned failure." };
    }
  } catch (error) {
    console.error("Error uploading Maximo configuration:", error);
    return { success: false, error: "Server error during upload." };
  }
}
