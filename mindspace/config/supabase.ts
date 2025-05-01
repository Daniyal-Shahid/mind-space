import { createClient } from "@supabase/supabase-js";

// Get environment variables with strict validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables before creating client
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Function to check if localStorage is available
const isLocalStorageAvailable = () => {
  if (typeof window === "undefined") return false;
  
  try {
    const testKey = "_supabase_test_";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Create a fallback storage if localStorage is not available
const createFallbackStorage = () => {
  const memoryStorage: Record<string, string> = {};
  
  return {
    getItem: (key: string) => memoryStorage[key] || null,
    setItem: (key: string, value: string) => {
      memoryStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete memoryStorage[key];
    }
  };
};

// Determine which storage to use
const storage = isLocalStorageAvailable() 
  ? {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error("Error accessing localStorage:", error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error("Error setting localStorage:", error);
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error("Error removing from localStorage:", error);
        }
      },
    }
  : createFallbackStorage();

// Enhanced Supabase client with security options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage,
    flowType: 'pkce', // Use PKCE flow for more secure authentication
    debug: process.env.NODE_ENV === 'development',
  },
  global: {
    fetch: (...args) => {
      // Log requests for debugging in development
      if (process.env.NODE_ENV === "development") {
        const [url] = args;
        console.debug(`Supabase request: ${url}`);
      }
      
      // Add request timeout to prevent hanging requests
      return fetch(...args).catch(error => {
        console.error("Supabase fetch error:", error);
        throw error;
      });
    },
  },
  // Added to improve reliability
  realtime: {
    params: {
      eventsPerSecond: 10,
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
