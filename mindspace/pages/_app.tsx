import "../styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
import Head from "next/head";
import { useEffect, useState } from "react";

import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/router";

import { AuthProvider } from "@/contexts/auth-context";
import { fontSans, fontMono } from "@/config/fonts";
import MainLayout from "@/layouts/MainLayout";
import { supabase } from "@/config/supabase";

import { SpeedInsights } from "@vercel/speed-insights/next"

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [supabaseInitialized, setSupabaseInitialized] = useState(false);

  // Client-side security
  useEffect(() => {
    // Prevent clickjacking attacks by breaking out of frames
    if (window.self !== window.top && window.top) {
      window.top.location.href = window.self.location.href;
    }

    // Mark Supabase as initialized after component mounts
    setSupabaseInitialized(true);

    // Disable browser autocomplete on sensitive forms as an extra precaution
    const sensitiveInputs = document.querySelectorAll('input[type="password"], input[name*="email"]');
    sensitiveInputs.forEach((input) => {
      if (input instanceof HTMLInputElement) {
        input.autocomplete = "off";
      }
    });
    
    // Set up global error handler for monitoring
    window.addEventListener("error", (event) => {
      // In a production app, you would send this to your error monitoring service
      console.error("Global error:", event.error);
      
      // Prevent showing sensitive error information to users
      if (process.env.NODE_ENV === "production") {
        event.preventDefault();
      }
    });
  }, []);

  return (
    <>
      <Head>
        {/* Security headers that can be applied client-side */}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        
        {/* Prevent content type sniffing */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        
        {/* Prevent XSS attacks */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://*.supabase.co;" />
        
        {/* Disable FLoC tracking */}
        <meta httpEquiv="Permissions-Policy" content="interest-cohort=()" />
      </Head>
      
      {/* Only render the app after client-side initialization */}
      {supabaseInitialized && (
        <AuthProvider>
          <HeroUIProvider navigate={router.push}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <MainLayout>
                <Component {...pageProps} />
              </MainLayout>
            </ThemeProvider>
          </HeroUIProvider>
        </AuthProvider>
      )}
      
      {/* Show a loading indicator while initializing */}
      {!supabaseInitialized && (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      <SpeedInsights />
    </>
  );
}

export const fonts = {
  sans: fontSans.style.fontFamily,
  mono: fontMono.style.fontFamily,
};
