import { useEffect } from "react";
import { useRouter } from "next/router";

import { useAuth } from "@/contexts/auth-context";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If the authentication has finished loading and there's no session, redirect to login
    if (!isLoading && !session) {
      // Get the current path to use as the return URL after login
      const currentPath = router.asPath;
      
      // Only encode the path if it's not already the login page to avoid redirect loops
      const returnUrl = !currentPath.includes('/auth/') 
        ? encodeURIComponent(currentPath)
        : encodeURIComponent('/profile');
      
      router.push({
        pathname: "/auth/login",
        query: { returnUrl },
      });
    }
  }, [session, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }
  
  // Also show loading if not authenticated yet (during redirect)
  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  // If authenticated, render the children
  return <>{children}</>;
};

export default ProtectedRoute;
