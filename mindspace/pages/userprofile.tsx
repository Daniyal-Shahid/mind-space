import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/auth-context';

/**
 * UserProfile page that redirects to the main profile page
 * This handles cases where users might directly access /userprofile
 */
export default function UserProfilePage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Only proceed if we're done loading auth state
    if (!isLoading) {
      // To prevent multiple redirects
      if (!redirecting) {
        setRedirecting(true);
        
        if (session) {
          // If user is logged in, redirect to profile page
          router.replace('/profile');
        } else {
          // If not authenticated, redirect to login page with return URL
          router.replace({
            pathname: '/auth/login',
            query: { returnUrl: '/profile' },
          });
        }
      }
    }
  }, [isLoading, session, router, redirecting]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4" />
      <p className="text-default-600">
        {isLoading ? "Checking authentication..." : "Redirecting..."}
      </p>
    </div>
  );
} 