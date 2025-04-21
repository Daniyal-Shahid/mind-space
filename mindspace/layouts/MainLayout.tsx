import { ReactNode } from "react";

import { Navbar } from "@/components/navbar";
import { ThemeSwitch } from "@/components/theme-switch";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <Navbar />
      <main className="px-6 py-8 md:py-12 max-w-7xl mx-auto">
        <div className="bg-background/90 rounded-xl shadow-md p-4 md:p-6">
          {children}
        </div>
      </main>
      <div className="fixed bottom-4 right-4 md:hidden">
        <ThemeSwitch />
      </div>
    </div>
  );
}
