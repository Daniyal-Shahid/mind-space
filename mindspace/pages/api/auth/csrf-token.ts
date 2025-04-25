import type { NextApiRequest, NextApiResponse } from "next";
import { setCSRFCookie } from "@/utils/security";
import { rateLimit } from "@/utils/rate-limit";

// Rate limiter for token generation to prevent abuse
// Allow 15 requests per minute per IP
const csrfTokenLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per interval
  limit: 15, // 15 requests per minute
});

/**
 * API route to generate CSRF tokens for forms
 * This endpoint generates a secure token, stores it in an HTTP-only cookie,
 * and returns the token to be included in forms
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET method
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get client IP for rate limiting
  const ip = req.headers['x-forwarded-for'] || 
             req.socket.remoteAddress || 
             'unknown';
  
  const ipStr = Array.isArray(ip) ? ip[0] : ip;

  try {
    // Apply rate limiting
    await csrfTokenLimiter.check(res, 15, ipStr);
    
    // Set secure, HTTP-only cookie with the CSRF token
    const csrfToken = setCSRFCookie(res);
    
    // Return the token to be included in the form
    return res.status(200).json({ csrfToken });
  } catch (error: any) {
    if (error.status === 429) {
      return res.status(429).json({
        error: "Too many requests",
        message: "Please try again later",
      });
    }
    
    console.error("Error generating CSRF token:", error);
    return res.status(500).json({ error: "Failed to generate security token" });
  }
} 