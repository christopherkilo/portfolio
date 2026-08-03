"use client";

import { Suspense } from "react";
import { FavoritesProvider } from "@/contexts/demos/event-horizon/FavoritesContext";
import { ReservationsProvider } from "@/contexts/demos/event-horizon/ReservationsContext";
import { ToastProvider } from "@/contexts/demos/event-horizon/ToastContext";
import { AuthModalProvider } from "@/contexts/demos/event-horizon/AuthModalContext";
import { AuthSessionProvider } from "@/components/demos/event-horizon/layout/AuthSessionProvider";
import { Navbar } from "@/components/demos/event-horizon/layout/Navbar";
import { Footer } from "@/components/demos/event-horizon/layout/Footer";
import { PageTransition } from "@/components/demos/event-horizon/shared/PageTransition";
import { ThemeProvider } from "@/contexts/demos/event-horizon/ThemeContext";
import { SignInModal } from "@/components/demos/event-horizon/auth/SignInModal";
import { AuthResumeListener } from "@/components/demos/event-horizon/auth/AuthResumeListener";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthSessionProvider>
        <AuthModalProvider>
          <FavoritesProvider>
            <ReservationsProvider>
              <ToastProvider>
                <a
                  href="#main"
                  className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:text-on-accent"
                >
                  Skip to content
                </a>
                <Navbar />
                <PageTransition>
                  <main id="main" className="relative flex-1">
                    {children}
                  </main>
                </PageTransition>
                <Footer />
                <SignInModal />
                <Suspense fallback={null}>
                  <AuthResumeListener />
                </Suspense>
              </ToastProvider>
            </ReservationsProvider>
          </FavoritesProvider>
        </AuthModalProvider>
      </AuthSessionProvider>
    </ThemeProvider>
  );
}
