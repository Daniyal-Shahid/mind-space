import type { AppProps } from "next/app";

import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useRouter } from "next/router";

import { AuthProvider } from "@/contexts/auth-context";
import { fontSans, fontMono } from "@/config/fonts";
import "@/styles/globals.css";
import MainLayout from "@/layouts/MainLayout";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <AuthProvider>
      <HeroUIProvider navigate={router.push}>
        <NextThemesProvider
          enableSystem
          attribute="class"
          defaultTheme="system"
        >
          <MainLayout>
            <Component {...pageProps} />
          </MainLayout>
        </NextThemesProvider>
      </HeroUIProvider>
    </AuthProvider>
  );
}

export const fonts = {
  sans: fontSans.style.fontFamily,
  mono: fontMono.style.fontFamily,
};
