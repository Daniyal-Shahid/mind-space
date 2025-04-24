import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only allow GET method
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check if supabase URL is set
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Check if supabase anon key is set
  const hasSupabaseAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if supabase service role is set
  const hasSupabaseServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  return res.status(200).json({
    environment: process.env.NODE_ENV,
    supabaseUrlSet: hasSupabaseUrl,
    supabaseAnonKeySet: hasSupabaseAnonKey,
    supabaseServiceRoleSet: hasSupabaseServiceRole,
    // Do not return the actual values for security reasons
    // Just return the first few characters to help with debugging
    supabaseUrlPrefix: hasSupabaseUrl
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 2)}...`
      : null,
    timestamp: new Date().toISOString(),
  });
}
