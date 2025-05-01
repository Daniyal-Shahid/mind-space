import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { useAuth } from "@/contexts/auth-context";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [localLoading, setLocalLoading] = useState(true);
  
  // Set a maximum loading time to prevent UI from being stuck
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 3000); // Allow 3 seconds maximum for loading
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Wait for auth to initialize
    if (!isLoading) {
      // If we're not authenticated after loading completes, redirect to login
      if (!session) {
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
      } else {
        // Successfully authenticated, stop showing loading UI
        setLocalLoading(false);
      }
    }
  }, [session, isLoading, router]);

  // Show loading state while checking authentication
  // Use either the auth loading state or our local loading state with timeout
  if (isLoading || (localLoading && !session)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }
  
  // If not authenticated but loading has completed, we'll redirect
  // Show a loading spinner briefly until the redirect happens
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
