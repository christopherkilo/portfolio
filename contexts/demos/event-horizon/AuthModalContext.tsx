"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  clearAuthIntent,
  saveAuthIntent,
  type AuthIntent,
} from "@/lib/demos/event-horizon/authIntent";

type AuthModalContextValue = {
  open: boolean;
  intent: AuthIntent | null;
  openSignIn: (intent?: AuthIntent | null) => void;
  closeSignIn: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<AuthIntent | null>(null);

  const openSignIn = useCallback((nextIntent: AuthIntent | null = null) => {
    setIntent(nextIntent);
    if (nextIntent) saveAuthIntent(nextIntent);
    else clearAuthIntent();
    setOpen(true);
  }, []);

  const closeSignIn = useCallback(() => {
    setOpen(false);
  }, []);

  const value = useMemo(
    () => ({ open, intent, openSignIn, closeSignIn }),
    [open, intent, openSignIn, closeSignIn],
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return ctx;
}
