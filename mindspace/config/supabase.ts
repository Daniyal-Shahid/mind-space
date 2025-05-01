import { createClient } from "@supabase/supabase-js";

// Get environment variables with strict validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables before creating client
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Enhanced Supabase client with security options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        if (typeof window === "undefined") return null;
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error("Error accessing localStorage:", error);
          return null;
        }
      },
      setItem: (key, value) => {
        if (typeof window === "undefined") return;
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error("Error setting localStorage:", error);
        }
      },
      removeItem: (key) => {
        if (typeof window === "undefined") return;
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error("Error removing from localStorage:", error);
        }
      },
    },
  },
  global: {
    fetch: (...args) => {
      // Log requests for debugging in development
      if (process.env.NODE_ENV === "development") {
        const [url] = args;
        console.debug(`Supabase request: ${url}`);
      }
      return fetch(...args);
    },
  },
});

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
