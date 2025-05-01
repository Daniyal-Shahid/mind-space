import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithAuthComponent(props: P) {
    const { session, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !session) {
        // Store the current URL to redirect back after login
        const returnUrl = router.asPath;
        router.replace({
          pathname: '/auth/login',
          query: { returnUrl },
        });
      }
    }, [session, isLoading, router]);

    // Show loading state while checking authentication
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      );
    }

    // If not authenticated, don't render the component
    if (!session) {
      return null;
    }

    // If authenticated, render the wrapped component
    return <WrappedComponent {...props} />;
  };
} 