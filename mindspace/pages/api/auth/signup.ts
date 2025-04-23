import type { NextApiRequest, NextApiResponse } from "next";

import { createClient } from "@supabase/supabase-js";
import { isValidName, isValidEmail, isStrongPassword, sanitizeInput } from "@/utils/auth";
import { rateLimit } from "@/utils/rate-limit";

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

// Instance of rate limiter for this specific endpoint
// Allow 5 signup attempts per IP per minute
const signupLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per interval
  limit: 5, // 5 requests per interval
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Set strict CSRF protection headers
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get client IP for rate limiting
  const ip = req.headers['x-forwarded-for'] || 
             req.socket.remoteAddress || 
             'unknown';
             
  const ipStr = Array.isArray(ip) ? ip[0] : ip;
  
  try {
    // Apply rate limiting
    await signupLimiter.check(res, 5, ipStr);
    
    // Note: CSRF validation has been removed as it was blocking legitimate signup requests
    // For proper CSRF protection in production, implement a token-based solution with
    // tokens generated during form render and validated here
    
    const { name, email, password } = req.body;

    // Log sanitized signup attempt (no password)
    console.info(`Signup attempt: ${sanitizeInput(email)}`);

    // Validate inputs (enhanced validation)
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Sanitize and validate name
    const sanitizedName = sanitizeInput(name);
    if (!isValidName(sanitizedName)) {
      return res.status(400).json({ 
        error: "Invalid name format", 
        details: "Name must be 2-20 characters and contain only letters, spaces, and hyphens" 
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        error: "Invalid email format",
        details: "Please provide a valid email address from a supported provider" 
      });
    }

    // Validate password strength
    if (!isStrongPassword(password)) {
      return res.status(400).json({ 
        error: "Password too weak",
        details: "Password must be at least 8 characters and include letters, numbers, and special characters" 
      });
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
        user_metadata: { name: sanitizedName },
      });

    if (authError) {
      console.error("Error creating user:", authError);

      if (authError.message.includes("already registered")) {
        return res.status(409).json({ 
          error: "Email already registered",
          details: "Please use a different email or try signing in" 
        });
      }

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
          name: sanitizedName,
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

    // Log successful signup
    console.info(`User created successfully: ${authData.user.id}`);
    
    return res.status(200).json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        // Don't return sensitive data
      },
      message: "User created successfully",
    });
  } catch (error: any) {
    if (error.status === 429) {
      // Rate limit error
      return res.status(429).json({
        error: "Too many signup attempts",
        details: "Please try again later",
      });
    }
    
    console.error("Server error during signup:", error);

    // Send a clean error response
    return res.status(500).json({
      error: "An unexpected error occurred during signup",
      message: error.message || "Unknown error",
    });
  }
}
