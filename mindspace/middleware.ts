import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of protected routes that require authentication
const PROTECTED_ROUTES = [
  '/mood-tracker',
  '/profile',
  '/journal',
  '/dashboard',
  // Add other protected routes as needed
];

// Public routes that should be accessible without authentication
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/reset-password',
  '/auth/update-password',
  '/',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  // Add other public routes as needed
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Create Supabase server client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  try {
    // Get current session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Get the current path
    const path = req.nextUrl.pathname;
    
    // Check if the path matches any protected route pattern
    const isProtectedRoute = PROTECTED_ROUTES.some(route => 
      path === route || path.startsWith(`${route}/`)
    );
    
    // Check if user is trying to access login/signup pages while already logged in
    if (session && PUBLIC_ROUTES.includes(path)) {
      // Let them proceed - no need to redirect from public pages
      return res;
    }
    
    // If no session and trying to access a protected route, redirect to login
    if (!session && isProtectedRoute) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/auth/login';
      redirectUrl.searchParams.set('returnUrl', path);
      return NextResponse.redirect(redirectUrl);
    }
    
    // For all other cases, proceed normally
    return res;
  } catch (error) {
    console.error('Middleware auth error:', error);
    // In case of auth errors, allow the request through to let client-side handle it
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}; 