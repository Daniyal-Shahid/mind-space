// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { rateLimit } from "@/utils/rate-limit";

type Data = {
  name: string;
  message?: string;
};

// Create a rate limiter instance for this endpoint
// Limits to 10 requests per minute per IP
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100, // Max 100 unique users per interval
  limit: 10, // 10 requests per interval
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | { error: string }>
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
    await limiter.check(res, 10, ipStr);

    // Set security headers
    res.setHeader('Cache-Control', 'no-store, private, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    res.status(200).json({ 
      name: "John Doe", 
      message: "This is a secure API endpoint"
    });
  } catch (error) {
    // Rate limit exceeded
    return res.status(429).json({ error: "Too many requests" });
  }
}
