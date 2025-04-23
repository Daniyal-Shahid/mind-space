import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';

// In-memory store for rate limiting
// In production, use Redis or a similar solution for distributed rate limiting
const rateLimit = {
  // Map to store IP addresses and their request counts
  ipMap: new Map<string, { count: number; resetTime: number }>(),
  
  // Rate limit configuration
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  
  // Check if the request exceeds the rate limit
  check(ip: string): { limited: boolean; remaining: number } {
    const now = Date.now();
    const record = this.ipMap.get(ip);
    
    // If no record exists or the reset time has passed, create a new record
    if (!record || record.resetTime < now) {
      this.ipMap.set(ip, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return { limited: false, remaining: this.maxRequests - 1 };
    }
    
    // Increment the count and check if it exceeds the limit
    record.count += 1;
    const limited = record.count > this.maxRequests;
    const remaining = Math.max(0, this.maxRequests - record.count);
    
    return { limited, remaining };
  },
};

// Function to get client IP (with fallbacks)
function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  
  if (forwardedFor) {
    // Get the first IP if there are multiple
    return forwardedFor.split(',')[0].trim();
  }
  
  // Fallback to default connection info
  return '127.0.0.1';
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Generate request ID for better tracking and debugging
  const requestId = nanoid();
  res.headers.set('x-request-id', requestId);
  
  // Set security headers
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Set strict Content Security Policy to prevent XSS
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://*.supabase.co;"
  );
  
  // Apply rate limiting only to API routes
  if (req.nextUrl.pathname.startsWith('/api')) {
    const ip = getClientIp(req);
    const { limited, remaining } = rateLimit.check(ip);
    
    res.headers.set('X-RateLimit-Limit', rateLimit.maxRequests.toString());
    res.headers.set('X-RateLimit-Remaining', remaining.toString());
    res.headers.set('X-RateLimit-Reset', (Date.now() + rateLimit.windowMs).toString());
    
    if (limited) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Please try again later',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      );
    }
  }
  
  return res;
}

export const config = {
  matcher: [
    // Apply to all API routes
    '/api/:path*',
    // Exclude static assets and public routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 