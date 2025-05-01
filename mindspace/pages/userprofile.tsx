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
  const [redirectTimeout, setRedirectTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set a maximum timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('Redirect timeout reached, forcing redirect to login');
      router.replace({
        pathname: '/auth/login',
        query: { returnUrl: '/profile' },
      });
    }, 5000); // 5 second timeout
    
    setRedirectTimeout(timeout);

    // If the user is logged in, redirect to the main profile page
    if (!isLoading) {
      if (session) {
        router.replace('/profile');
      } else {
        // If not authenticated, redirect to login page with return URL
        router.replace({
          pathname: '/auth/login',
          query: { returnUrl: '/profile' },
        });
      }
    }

    // Clean up timeout
    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [isLoading, session, router, redirectTimeout]);

  // Show a loading spinner while checking authentication and redirecting
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4" />
      <p className="text-default-600">Redirecting...</p>
    </div>
  );
} 