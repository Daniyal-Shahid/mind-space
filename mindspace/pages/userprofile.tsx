import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/auth-context';

/**
 * UserProfile page that redirects to the main profile page
 * This handles cases where users might directly access /userprofile
 */
export default function UserProfilePage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();

  useEffect(() => {
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
  }, [isLoading, session, router]);

  // Show a loading spinner while checking authentication and redirecting
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
    </div>
  );
} 