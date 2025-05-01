import { supabase } from "@/config/supabase";

/**
 * Name validation
 * Requires minimum 2 characters, maximum 20 characters, and only letters, spaces, and hyphens
 */
export const isValidName = (name: string): boolean => {
  // Check length requirements
  if (name.length < 2 || name.length > 20) {
    return false;
  }

  // Check for letters, spaces, and hyphens only
  const nameRegex = /^[a-zA-Z\s-]+$/;
  return nameRegex.test(name);
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  return input.trim();
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, with a mix of letters, numbers, and special characters
  return password.length >= 8 && 
    /[A-Za-z]/.test(password) && 
    /[0-9]/.test(password) && 
    /[^A-Za-z0-9]/.test(password);
};

/**
 * Send a password reset email
 */
export const sendPasswordResetEmail = async (email: string) => {
  // Sanitize email
  const sanitizedEmail = sanitizeInput(email);

  // Validate email
  if (!isValidEmail(sanitizedEmail)) {
    throw new Error("Please enter a valid email address");
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) throw error;
  } catch (error) {
    console.error("Password reset error:", error);
    throw error;
  }
};

/**
 * Update user's password
 */
export const updatePassword = async (password: string) => {
  // Validate password
  if (!isStrongPassword(password)) {
    throw new Error(
      "Password must be at least 8 characters and include letters, numbers, and special characters"
    );
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) throw error;
  } catch (error) {
    console.error("Password update error:", error);
    throw error;
  }
};

/**
 * Sign in a user with Supabase
 */
export const signIn = async (email: string, password: string) => {
  // Sanitize email
  const sanitizedEmail = sanitizeInput(email);

  // Validate email
  if (!isValidEmail(sanitizedEmail)) {
    throw new Error("Please enter a valid email address");
  }

  try {
    // Sign in with Supabase auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        throw new Error("Invalid email or password");
      } else {
        throw new Error(error.message);
      }
    }

    return data;
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  }
};

/**
 * Sign up a new user with Supabase
 */
export const signUp = async (name: string, email: string, password: string) => {
  // Sanitize inputs
  const sanitizedName = sanitizeInput(name);
  const sanitizedEmail = sanitizeInput(email);

  // Validate inputs
  if (!sanitizedName) {
    throw new Error("Name is required");
  }

  if (!isValidEmail(sanitizedEmail)) {
    throw new Error("Please enter a valid email address");
  }

  if (!isStrongPassword(password)) {
    throw new Error(
      "Password must be at least 8 characters and include letters, numbers, and special characters"
    );
  }

  try {
    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        data: {
          name: sanitizedName,
        },
      },
    });

    if (error) throw error;

    // If signup successful, create a user profile
    if (data.user) {
      try {
        const { error: profileError } = await supabase
          .from("UserProfile")
          .insert([
            {
              id: data.user.id,
              name: sanitizedName,
              email: sanitizedEmail,
              created_at: new Date().toISOString(),
            },
          ]);

        if (profileError) {
          console.error("Error creating user profile:", profileError);
          // Don't throw here - the user is created, just not the profile
        }
      } catch (profileError) {
        console.error("Error creating user profile:", profileError);
      }
    }

    return data;
  } catch (error) {
    console.error("Sign up error:", error);
    throw error;
  }
};

/**
 * Check if user is authenticated
 */
export const checkAuthentication = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    return {
      isAuthenticated: !!data.session,
      session: data.session,
      user: data.session?.user,
    };
  } catch (error) {
    console.error("Authentication check error:", error);
    return {
      isAuthenticated: false,
      session: null,
      user: null,
    };
  }
};

/**
 * Sign out current user
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};
