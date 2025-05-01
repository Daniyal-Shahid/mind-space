import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/router";
import { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/config/supabase";
import { UserProfile } from "@/config/supabase";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  // Setup authentication state
  useEffect(() => {
    // Set a timeout to prevent endless loading state
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn("Auth initialization timed out after 10 seconds");
        setIsLoading(false);
      }
    }, 10000);

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        // Update state with session data
        setSession(session);
        setUser(session?.user ?? null);

        // Fetch user profile if session exists
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setError(error instanceof Error ? error : new Error("Failed to initialize auth"));
      } finally {
        // Always set loading to false when done
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    };

    // Initialize auth immediately
    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Auth event: ${event}`);
        
        setSession(session);
        setUser(session?.user ?? null);

        // Handle profile on auth changes
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    // Clean up
    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("UserProfile")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      setProfile(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Don't set error state here to prevent blocking the auth flow
      // Just log the error and continue
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setSession(null);
      setUser(null);
      setProfile(null);
      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
      setError(error instanceof Error ? error : new Error("Failed to sign out"));
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    session,
    user,
    profile,
    isLoading,
    error,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
