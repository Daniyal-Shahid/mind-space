import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
