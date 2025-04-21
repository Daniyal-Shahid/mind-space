import { sanitizeInput } from "./auth";

import { supabase } from "@/config/supabase";

// Type for mood entry parameters
type MoodType = "great" | "good" | "neutral" | "bad" | "awful";

interface InsertMoodParams {
  mood: MoodType;
  note?: string;
  date?: string; // Format: YYYY-MM-DD, defaults to today if not provided
}

interface UpdateMoodParams {
  id: string; // The UUID of the entry to update
  mood: MoodType;
  note?: string;
}

interface FetchMoodParams {
  startDate?: string; // Format: YYYY-MM-DD
  endDate?: string; // Format: YYYY-MM-DD
  limit?: number; // Maximum number of entries to fetch
}

/**
 * Insert a mood entry securely into Supabase
 *
 * @param params Object containing mood, optional note, and optional date
 * @returns The inserted mood entry or throws an error
 */
export const insertMoodEntry = async (params: InsertMoodParams) => {
  // Check if user is authenticated
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("You must be logged in to record a mood");
  }

  const userId = session.user.id;

  // Validate and sanitize inputs
  if (
    !params.mood ||
    !["great", "good", "neutral", "bad", "awful"].includes(params.mood)
  ) {
    throw new Error("Invalid mood type");
  }

  // Sanitize note if provided to prevent XSS
  const sanitizedNote = params.note ? sanitizeInput(params.note) : undefined;

  // Validate date if provided, otherwise use today
  let entryDate = params.date;

  if (entryDate) {
    // Simple validation for YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(entryDate)) {
      throw new Error("Date must be in YYYY-MM-DD format");
    }

    // Ensure date is not in the future - proper way to compare dates without time component
    // Get current date in YYYY-MM-DD format to ensure consistent comparison
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD format

    // Now compare the date strings directly - this avoids timezone issues
    if (entryDate > todayStr) {
      throw new Error("Cannot log mood entries for future dates");
    }
  }

  try {
    // Insert the mood entry
    const { data, error } = await supabase
      .from("MoodEntry")
      .insert({
        mood: params.mood,
        note: sanitizedNote,
        date: entryDate, // Will default to CURRENT_DATE in database if undefined
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting mood entry:", error);
      throw new Error(error.message || "Failed to save mood entry");
    }

    return data;
  } catch (error) {
    console.error("Error in insertMoodEntry:", error);
    // Re-throw with a user-friendly message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};

/**
 * Delete a mood entry
 *
 * @param entryId The UUID of the entry to delete
 * @returns Success indicator or throws an error
 */
export const deleteMoodEntry = async (entryId: string) => {
  // Check if user is authenticated
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("You must be logged in to delete a mood entry");
  }

  try {
    // Delete the entry (RLS will ensure the user can only delete their own entries)
    const { error } = await supabase
      .from("MoodEntry")
      .delete()
      .eq("id", entryId);

    if (error) {
      console.error("Error deleting mood entry:", error);
      throw new Error(error.message || "Failed to delete mood entry");
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteMoodEntry:", error);
    // Re-throw with a user-friendly message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};

/**
 * Fetch mood entries for a given time period
 *
 * @param params Object containing optional start date, end date, and limit
 * @returns Array of mood entries or throws an error
 */
export const fetchMoodEntries = async (params?: FetchMoodParams) => {
  // Check if user is authenticated
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("You must be logged in to view mood entries");
  }

  const userId = session.user.id;

  try {
    // Start building the query
    let query = supabase
      .from("MoodEntry")
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
      console.error("Error fetching mood entries:", error);
      throw new Error(error.message || "Failed to fetch mood entries");
    }

    return data;
  } catch (error) {
    console.error("Error in fetchMoodEntries:", error);
    // Re-throw with a user-friendly message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};

/**
 * Update an existing mood entry
 *
 * @param params Object containing id, mood and optional note
 * @returns The updated mood entry or throws an error
 */
export const updateMoodEntry = async (params: UpdateMoodParams) => {
  // Check if user is authenticated
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("You must be logged in to update a mood entry");
  }

  // Validate inputs
  if (!params.id) {
    throw new Error("Entry ID is required");
  }

  if (
    !params.mood ||
    !["great", "good", "neutral", "bad", "awful"].includes(params.mood)
  ) {
    throw new Error("Invalid mood type");
  }

  // Sanitize note if provided to prevent XSS
  const sanitizedNote = params.note ? sanitizeInput(params.note) : undefined;

  try {
    // Update the mood entry (RLS will ensure the user can only update their own entries)
    const { data, error } = await supabase
      .from("MoodEntry")
      .update({
        mood: params.mood,
        note: sanitizedNote,
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating mood entry:", error);
      throw new Error(error.message || "Failed to update mood entry");
    }

    return data;
  } catch (error) {
    console.error("Error in updateMoodEntry:", error);
    // Re-throw with a user-friendly message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};
