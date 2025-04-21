import type { NextApiRequest, NextApiResponse } from "next";

import { createClient } from "@supabase/supabase-js";

// Make sure environment variables are properly loaded and available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseServiceRole) {
  console.error(
    "Missing required environment variables for Supabase admin client",
  );
}

// Create a Supabase client with service role key for backend operations
const supabaseAdmin = createClient(
  supabaseUrl || "",
  supabaseServiceRole || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, password } = req.body;

    // Validate inputs (basic validation)
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if environment variables are configured
    if (!supabaseUrl || !supabaseServiceRole) {
      return res.status(500).json({
        error: "Server configuration error",
        details: "Missing Supabase credentials",
      });
    }

    // 1. Create the user in auth.users
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm the email for development
        user_metadata: { name },
      });

    if (authError) {
      console.error("Error creating user:", authError);

      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(500).json({ error: "Failed to create user" });
    }

    // 2. Manually create the user profile if needed
    // This is a fallback in case the trigger doesn't work
    try {
      const { error: profileError } = await supabaseAdmin
        .from("UserProfile")
        .insert({
          id: authData.user.id,
          name,
          email,
        });

      // If there's an error but it's about the row already existing, that's fine
      if (profileError && !profileError.message.includes("duplicate")) {
        console.error("Error creating user profile:", profileError);
        // We don't return an error here because the auth user was created successfully
        // and the trigger might have already created the profile
      }
    } catch (profileInsertError) {
      console.error("Error in profile insert:", profileInsertError);
      // Continue anyway as the auth user was created
    }

    return res.status(200).json({
      user: authData.user,
      message: "User created successfully",
    });
  } catch (error: any) {
    console.error("Server error during signup:", error);

    // Send a clean error response
    return res.status(500).json({
      error: "An unexpected error occurred during signup",
      message: error.message || "Unknown error",
    });
  }
}
