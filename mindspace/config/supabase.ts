import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

// Get environment variables with strict validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables before creating client
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Function to check if we're running in a browser environment
const isBrowser = () => typeof window !== "undefined";

// Enhanced Supabase client with security options for client-side usage
export const supabase = isBrowser()
  ? createBrowserClient(
      supabaseUrl,
      supabaseAnonKey
    )
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

// Browser-specific storage helpers
export const localStorageHelpers = {
  getItem: (key: string): string | null => {
    if (!isBrowser()) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): void => {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error("Error setting localStorage:", error);
    }
  },
  
  removeItem: (key: string): void => {
    if (!isBrowser()) return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Error removing from localStorage:", error);
    }
  },
};

// Types based on your database schema
export type UserProfile = {
  id: string;
  name: string;
  email: string;
  profile_image: string | null;
  created_at: string;
};

export type MoodEntry = {
  id: string;
  mood: string;
  note: string;
  date: string;
  user_id: string;
};

export type JournalEntry = {
  id: string;
  title: string;
  content: string;
  tags: string;
  date: string;
  user_id: string;
};

// For type completion, more entry types can be added here
export type SleepEntry = {
  id: string;
  hours_slept: number;
  sleep_quality: number;
  date: string;
  user_id: string;
};

export type FoodEntry = {
  id: string;
  meals: string;
  feeling_after?: string;
  date: string;
  user_id: string;
};

export type WaterEntry = {
  id: string;
  cups: number;
  date: string;
  user_id: string;
};

export type GratitudeEntry = {
  id: string;
  gratitude_items: string;
  date: string;
  user_id: string;
};
