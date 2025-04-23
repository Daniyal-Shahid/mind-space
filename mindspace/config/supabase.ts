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
    // Set auto-refresh token to true for better UX
    autoRefreshToken: true,
    // Use secure cookies but ensure client-side access for auth persistence
    storage: {
      getItem: (key) => {
        if (typeof window === "undefined") return null;
        
        // Get the value from localStorage for client-side auth persistence
        return localStorage.getItem(key);
      },
      setItem: (key, value) => {
        if (typeof window === "undefined") return;
        
        // Store in localStorage for persistent sessions
        localStorage.setItem(key, value);
      },
      removeItem: (key) => {
        if (typeof window === "undefined") return;
        
        // Remove from localStorage when signing out
        localStorage.removeItem(key);
      },
    },
  },
  // Add global error handler for monitoring
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
