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

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await fetchUserProfile(session.user.id);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setError(error instanceof Error ? error : new Error("Failed to initialize auth"));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn("Auth initialization timed out. Setting isLoading to false.");
        setIsLoading(false);
      }
    }, 5000); // 5 second timeout

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
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

      if (error) {
        // If the profile doesn't exist, don't treat as a critical error
        if (error.code === 'PGRST116') {
          console.warn(`User profile not found for ID: ${userId}. This is expected for new users.`);
          setProfile(null);
          setError(null);
          return;
        }
        throw error;
      }

      setProfile(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Don't set error as this could block the user experience
      setProfile(null);
    } finally {
      // Always ensure loading ends after profile fetch attempt
      setIsLoading(false);
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
