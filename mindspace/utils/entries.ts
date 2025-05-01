import { sanitizeInput } from "./auth";
import { supabase } from "@/config/supabase";

// Types for different entries
interface SleepEntryParams {
  id?: string;
  hours_slept: number;
  sleep_quality: number;
  date?: string;
}

interface FoodEntryParams {
  id?: string;
  meals: string;
  feeling_after?: string;
  date?: string;
}

interface WaterEntryParams {
  id?: string;
  cups: number;
  date?: string;
}

interface GratitudeEntryParams {
  id?: string;
  gratitude_items: string;
  date?: string;
}

interface FetchEntriesParams {
  startDate?: string; // Format: YYYY-MM-DD
  endDate?: string; // Format: YYYY-MM-DD
  limit?: number; // Maximum number of entries to fetch
}

/**
 * Validate date string in YYYY-MM-DD format
 *
 * @param date Date string to validate
 * @returns Boolean indicating if the date is valid
 */
const isValidDate = (date?: string): boolean => {
  if (!date) return false;
  
  // Simple validation for YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!dateRegex.test(date)) {
    return false;
  }
  
  // Ensure date is not in the future
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  return date <= today;
};

/**
 * Check if the user is authenticated, throws an error if not
 */
const checkAuthentication = async (): Promise<string> => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("You must be logged in to access entries");
  }

  return session.user.id;
};

// ======== SLEEP ENTRIES ========

/**
 * Insert a sleep entry into Supabase
 */
export const insertSleepEntry = async (params: SleepEntryParams) => {
  const userId = await checkAuthentication();
  
  // Validate inputs
  if (params.hours_slept < 0 || params.hours_slept > 24) {
    throw new Error("Hours slept must be between 0 and 24");
  }
  
  if (params.sleep_quality < 1 || params.sleep_quality > 10) {
    throw new Error("Sleep quality must be between 1 and 10");
  }
  
  // Validate date if provided
  if (params.date && !isValidDate(params.date)) {
    throw new Error("Date must be in YYYY-MM-DD format and not in the future");
  }
  
  try {
    // Insert the sleep entry
    const { data, error } = await supabase
      .from("SleepEntry")
      .insert({
        hours_slept: params.hours_slept,
        sleep_quality: params.sleep_quality,
        date: params.date, // Will default to CURRENT_DATE in database if undefined
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting sleep entry:", error);
      throw new Error(error.message || "Failed to save sleep entry");
    }

    return data;
  } catch (error) {
    console.error("Error in insertSleepEntry:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};

/**
 * Update a sleep entry in Supabase
 */
export const updateSleepEntry = async (params: SleepEntryParams) => {
  await checkAuthentication();
  
  // Validate inputs
  if (!params.id) {
    throw new Error("Entry ID is required");
  }
  
  if (params.hours_slept < 0 || params.hours_slept > 24) {
    throw new Error("Hours slept must be between 0 and 24");
  }
  
  if (params.sleep_quality < 1 || params.sleep_quality > 10) {
    throw new Error("Sleep quality must be between 1 and 10");
  }
  
  try {
    // Update the sleep entry
    const { data, error } = await supabase
      .from("SleepEntry")
      .update({
        hours_slept: params.hours_slept,
        sleep_quality: params.sleep_quality,
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating sleep entry:", error);
      throw new Error(error.message || "Failed to update sleep entry");
    }

    return data;
  } catch (error) {
    console.error("Error in updateSleepEntry:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};

/**
 * Delete a sleep entry
 */
export const deleteSleepEntry = async (entryId: string) => {
  await checkAuthentication();
  
  try {
    const { error } = await supabase
      .from("SleepEntry")
      .delete()
      .eq("id", entryId);

    if (error) {
      console.error("Error deleting sleep entry:", error);
      throw new Error(error.message || "Failed to delete sleep entry");
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteSleepEntry:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};

/**
 * Fetch sleep entries for a given time period
 */
export const fetchSleepEntries = async (params?: FetchEntriesParams) => {
  const userId = await checkAuthentication();

  try {
    // Start building the query
    let query = supabase
      .from("SleepEntry")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    // Add date filters if provided
    if (params?.startDate) {
      query = query.gte("date", params.startDate);
    }

    if (params?.endDate) {
      query = query.lte("date", params.endDate);
    }

    // Add limit if provided
    if (params?.limit && params.limit > 0) {
      query = query.limit(params.limit);
    }

    // Execute the query
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching sleep entries:", error);
      throw new Error(error.message || "Failed to fetch sleep entries");
    }

    return data;
  } catch (error) {
    console.error("Error in fetchSleepEntries:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};

// ======== FOOD ENTRIES ========

/**
 * Insert a food entry into Supabase
 */
export const insertFoodEntry = async (params: FoodEntryParams) => {
  const userId = await checkAuthentication();
  
  // Validate inputs
  if (!params.meals || params.meals.trim() === "") {
    throw new Error("Meals information is required");
  }
  
  // Sanitize inputs
  const sanitizedMeals = sanitizeInput(params.meals);
  const sanitizedFeeling = params.feeling_after 
    ? sanitizeInput(params.feeling_after) 
    : undefined;
  
  // Validate date if provided
  if (params.date && !isValidDate(params.date)) {
    throw new Error("Date must be in YYYY-MM-DD format and not in the future");
  }
  
  try {
    // Insert the food entry
    const { data, error } = await supabase
      .from("FoodEntry")
      .insert({
        meals: sanitizedMeals,
        feeling_after: sanitizedFeeling,
        date: params.date, // Will default to CURRENT_DATE in database if undefined
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting food entry:", error);
      throw new Error(error.message || "Failed to save food entry");
    }

    return data;
  } catch (error) {
    console.error("Error in insertFoodEntry:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};

/**
 * Update a food entry in Supabase
 */
export const updateFoodEntry = async (params: FoodEntryParams) => {
  await checkAuthentication();
  
  // Validate inputs
  if (!params.id) {
    throw new Error("Entry ID is required");
  }
  
  if (!params.meals || params.meals.trim() === "") {
    throw new Error("Meals information is required");
  }
  
  // Sanitize inputs
  const sanitizedMeals = sanitizeInput(params.meals);
  const sanitizedFeeling = params.feeling_after 
    ? sanitizeInput(params.feeling_after) 
    : undefined;
  
  try {
    // Update the food entry
    const { data, error } = await supabase
      .from("FoodEntry")
      .update({
        meals: sanitizedMeals,
        feeling_after: sanitizedFeeling,
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating food entry:", error);
      throw new Error(error.message || "Failed to update food entry");
    }

    return data;
  } catch (error) {
    console.error("Error in updateFoodEntry:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};

/**
 * Delete a food entry
 */
export const deleteFoodEntry = async (entryId: string) => {
  await checkAuthentication();
  
  try {
    const { error } = await supabase
      .from("FoodEntry")
      .delete()
      .eq("id", entryId);

    if (error) {
      console.error("Error deleting food entry:", error);
      throw new Error(error.message || "Failed to delete food entry");
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteFoodEntry:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};

/**
 * Fetch food entries for a given time period
 */
export const fetchFoodEntries = async (params?: FetchEntriesParams) => {
  const userId = await checkAuthentication();

  try {
    // Start building the query
    let query = supabase
      .from("FoodEntry")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    // Add date filters if provided
    if (params?.startDate) {
      query = query.gte("date", params.startDate);
    }

    if (params?.endDate) {
      query = query.lte("date", params.endDate);
    }

    // Add limit if provided
    if (params?.limit && params.limit > 0) {
      query = query.limit(params.limit);
    }

    // Execute the query
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching food entries:", error);
      throw new Error(error.message || "Failed to fetch food entries");
    }

    return data;
  } catch (error) {
    console.error("Error in fetchFoodEntries:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};

// ======== WATER ENTRIES ========

/**
 * Insert a water entry into Supabase
 */
export const insertWaterEntry = async (params: WaterEntryParams) => {
  const userId = await checkAuthentication();
  
  // Validate inputs
  if (params.cups < 0 || params.cups > 30) {
    throw new Error("Cups must be between 0 and 30");
  }
  
  // Validate date if provided
  if (params.date && !isValidDate(params.date)) {
    throw new Error("Date must be in YYYY-MM-DD format and not in the future");
  }
  
  try {
    // Insert the water entry
    const { data, error } = await supabase
      .from("WaterEntry")
      .insert({
        cups: params.cups,
        date: params.date, // Will default to CURRENT_DATE in database if undefined
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting water entry:", error);
      throw new Error(error.message || "Failed to save water entry");
    }

    return data;
  } catch (error) {
    console.error("Error in insertWaterEntry:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};

/**
 * Update a water entry in Supabase
 */
export const updateWaterEntry = async (params: WaterEntryParams) => {
  await checkAuthentication();
  
  // Validate inputs
  if (!params.id) {
    throw new Error("Entry ID is required");
  }
  
  if (params.cups < 0 || params.cups > 30) {
    throw new Error("Cups must be between 0 and 30");
  }
  
  try {
    // Update the water entry
    const { data, error } = await supabase
      .from("WaterEntry")
      .update({
        cups: params.cups,
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating water entry:", error);
      throw new Error(error.message || "Failed to update water entry");
    }

    return data;
  } catch (error) {
    console.error("Error in updateWaterEntry:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};

/**
 * Delete a water entry
 */
export const deleteWaterEntry = async (entryId: string) => {
  await checkAuthentication();
  
  try {
    const { error } = await supabase
      .from("WaterEntry")
      .delete()
      .eq("id", entryId);

    if (error) {
      console.error("Error deleting water entry:", error);
      throw new Error(error.message || "Failed to delete water entry");
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteWaterEntry:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};

/**
 * Fetch water entries for a given time period
 */
export const fetchWaterEntries = async (params?: FetchEntriesParams) => {
  const userId = await checkAuthentication();

  try {
    // Start building the query
    let query = supabase
      .from("WaterEntry")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    // Add date filters if provided
    if (params?.startDate) {
      query = query.gte("date", params.startDate);
    }

    if (params?.endDate) {
      query = query.lte("date", params.endDate);
    }

    // Add limit if provided
    if (params?.limit && params.limit > 0) {
      query = query.limit(params.limit);
    }

    // Execute the query
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching water entries:", error);
      throw new Error(error.message || "Failed to fetch water entries");
    }

    return data;
  } catch (error) {
    console.error("Error in fetchWaterEntries:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};

// ======== GRATITUDE ENTRIES ========

/**
 * Insert a gratitude entry into Supabase
 */
export const insertGratitudeEntry = async (params: GratitudeEntryParams) => {
  const userId = await checkAuthentication();
  
  // Validate inputs
  if (!params.gratitude_items || params.gratitude_items.trim() === "") {
    throw new Error("Gratitude items are required");
  }
  
  // Sanitize inputs
  const sanitizedItems = sanitizeInput(params.gratitude_items);
  
  // Validate date if provided
  if (params.date && !isValidDate(params.date)) {
    throw new Error("Date must be in YYYY-MM-DD format and not in the future");
  }
  
  try {
    // Insert the gratitude entry
    const { data, error } = await supabase
      .from("GratitudeEntry")
      .insert({
        gratitude_items: sanitizedItems,
        date: params.date, // Will default to CURRENT_DATE in database if undefined
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting gratitude entry:", error);
      throw new Error(error.message || "Failed to save gratitude entry");
    }

    return data;
  } catch (error) {
    console.error("Error in insertGratitudeEntry:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};

/**
 * Update a gratitude entry in Supabase
 */
export const updateGratitudeEntry = async (params: GratitudeEntryParams) => {
  await checkAuthentication();
  
  // Validate inputs
  if (!params.id) {
    throw new Error("Entry ID is required");
  }
  
  if (!params.gratitude_items || params.gratitude_items.trim() === "") {
    throw new Error("Gratitude items are required");
  }
  
  // Sanitize inputs
  const sanitizedItems = sanitizeInput(params.gratitude_items);
  
  try {
    // Update the gratitude entry
    const { data, error } = await supabase
      .from("GratitudeEntry")
      .update({
        gratitude_items: sanitizedItems,
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating gratitude entry:", error);
      throw new Error(error.message || "Failed to update gratitude entry");
    }

    return data;
  } catch (error) {
    console.error("Error in updateGratitudeEntry:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};

/**
 * Delete a gratitude entry
 */
export const deleteGratitudeEntry = async (entryId: string) => {
  await checkAuthentication();
  
  try {
    const { error } = await supabase
      .from("GratitudeEntry")
      .delete()
      .eq("id", entryId);

    if (error) {
      console.error("Error deleting gratitude entry:", error);
      throw new Error(error.message || "Failed to delete gratitude entry");
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteGratitudeEntry:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};

/**
 * Fetch gratitude entries for a given time period
 */
export const fetchGratitudeEntries = async (params?: FetchEntriesParams) => {
  const userId = await checkAuthentication();

  try {
    // Start building the query
    let query = supabase
      .from("GratitudeEntry")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    // Add date filters if provided
    if (params?.startDate) {
      query = query.gte("date", params.startDate);
    }

    if (params?.endDate) {
      query = query.lte("date", params.endDate);
    }

    // Add limit if provided
    if (params?.limit && params.limit > 0) {
      query = query.limit(params.limit);
    }

    // Execute the query
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching gratitude entries:", error);
      throw new Error(error.message || "Failed to fetch gratitude entries");
    }

    return data;
  } catch (error) {
    console.error("Error in fetchGratitudeEntries:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
}; 