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
 * Email validation using regex
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // List of trusted email providers
  const trustedEmailProviders = [
    "@gmail.com",
    "@yahoo.com",
    "@outlook.com",
    "@hotmail.com",
    "@icloud.com",
    "@protonmail.com",
    "@aol.com",
    "@me.com",
    "@live.com",
    "@msn.com"
  ];

  // First check if the email matches the basic regex pattern
  if (!emailRegex.test(email)) {
    return false;
  }

  // Extract the domain part
  const domain = "@" + email.split("@")[1].toLowerCase();
  
  // Check if the domain is in our trusted list
  return trustedEmailProviders.includes(domain);
};

/**
 * Password strength validation
 * Requires minimum 8 characters, at least one letter, one number, and one special character
 */
export const isStrongPassword = (password: string): boolean => {
  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

  return passwordRegex.test(password);
};

/**
 * Sanitize user input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>&"']/g, (match) => {
    switch (match) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      case "'":
        return "&#x27;";
      default:
        return match;
    }
  });
};

/**
 * Send password reset email with a link to reset password
 */
export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  if (!isValidEmail(email)) {
    throw new Error("Please enter a valid email address");
  }

  const sanitizedEmail = sanitizeInput(email);

  // Create the reset URL with absolute path to ensure it works properly
  const resetUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/update-password`
      : "/auth/update-password"; // Fallback for SSR

  console.log(
    `Sending password reset to ${sanitizedEmail} with redirect URL: ${resetUrl}`,
  );

  const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
    redirectTo: resetUrl,
  });

  if (error) {
    console.error("Password reset email error:", error);
    throw new Error(error.message);
  }
};

/**
 * Update user's password during the reset flow
 */
export const updatePassword = async (newPassword: string): Promise<void> => {
  console.log("--- updatePassword: Starting function execution ---");

  if (!isStrongPassword(newPassword)) {
    console.error("updatePassword: Password strength validation failed");
    throw new Error(
      "Password must be at least 8 characters and include letters, numbers, and special characters",
    );
  }

  // Check if we have a session first
  console.log("updatePassword: Checking for active session");
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    console.error("updatePassword: No active session found");
    throw new Error(
      "No active session found. Please request a new password reset link.",
    );
  }

  console.log(
    "updatePassword: Found active session for user",
    sessionData.session.user.id,
  );
  console.log(
    "updatePassword: Calling supabase.auth.updateUser to update password",
  );

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("updatePassword: Password update error:", error);
      if (error.message.includes("different from the old password")) {
        throw new Error(
          "New password must be different from your current password.",
        );
      }
      throw new Error(error.message);
    }

    console.log(
      "updatePassword: Password updated successfully, returning to component",
    );

    // We'll let the UI handle the redirect and not sign out immediately
    // This helps ensure the success message is shown properly
    return;
  } catch (error) {
    console.error("updatePassword: Error occurred during execution:", error);
    // Re-throw the error to be handled by the component
    throw error;
  } finally {
    console.log("--- updatePassword: Function execution completed ---");
  }
};

/**
 * Sign up a new user with Supabase
 */
export const signUp = async (name: string, email: string, password: string, csrfToken?: string) => {
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
      "Password must be at least 8 characters and include letters, numbers, and special characters",
    );
  }

  try {
    // First attempt: Use the server API (preferred method)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: sanitizedName,
          email: sanitizedEmail,
          password,
          csrfToken
        }),
      });

      // Handle non-JSON responses
      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error("Failed to parse JSON response:", jsonError);
          throw new Error("Invalid server response");
        }
      } else {
        // Handle non-JSON response (like HTML error pages)
        const textResponse = await response.text();

        console.error(
          "Received non-JSON response:",
          textResponse.substring(0, 150) + "...",
        );
        throw new Error("Server returned an invalid response format");
      }

      if (!response.ok) {
        throw new Error(data?.error || "Error creating account");
      }

      // Return in the same format as supabase.auth.signUp
      return {
        user: data.user,
        session: null, // Server endpoint doesn't create session
      };
    } catch (apiError) {
      console.error(
        "API signup failed, falling back to client signup:",
        apiError,
      );

      // Second attempt: Fallback to client-side signup
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          data: {
            name: sanitizedName,
          },
        },
      });

      if (error) {
        console.error("Supabase signup error:", error);
        throw new Error(error.message);
      }

      // If UserProfile wasn't created by the trigger, create it manually
      if (data.user) {
        try {
          // Check if UserProfile exists
          const { data: profileData, error: profileCheckError } = await supabase
            .from("UserProfile")
            .select("*")
            .eq("id", data.user.id)
            .single();

          if (profileCheckError && profileCheckError.code !== "PGRST116") {
            console.error("Error checking UserProfile:", profileCheckError);
          }

          // If profile doesn't exist, create it manually
          if (!profileData) {
            const { error: insertError } = await supabase
              .from("UserProfile")
              .insert({
                id: data.user.id,
                name: sanitizedName,
                email: sanitizedEmail,
              });

            if (insertError) {
              console.error(
                "Error creating UserProfile manually:",
                insertError,
              );
              // Continue anyway since the auth user was created
            }
          }
        } catch (profileError) {
          console.error("Error in profile creation fallback:", profileError);
          // Continue anyway since the auth user was created
        }
      }

      return data;
    }
  } catch (error) {
    console.error("Signup process error:", error);
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
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  return true;
};
