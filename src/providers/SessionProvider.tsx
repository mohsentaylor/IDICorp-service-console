"use client";
/**
 * Holds the signed-in session in memory only (never localStorage), as the
 * token is a credential. Reloading the page therefore requires a new sign-in,
 * which by the backend contract also starts a new task collection.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onSessionExpired } from "@/lib/session/sessionEvents";
import type { Session } from "@/types";

interface SessionContextValue {
  session: Session | null;
  /** Message shown on the sign-in screen (expiry, sign-out). */
  notice: string;
  signIn: (session: Session) => void;
  signOut: (notice?: string) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState("");

  const signIn = useCallback((next: Session) => {
    setSession(next);
    setNotice("");
  }, []);

  const signOut = useCallback((message = "") => {
    setSession(null);
    setNotice(message);
  }, []);

  // Only an expiry for the *current* token signs the user out.
  useEffect(
    () =>
      onSessionExpired((token) => {
        if (token === session?.token) signOut("Your session expired. Please sign in again.");
      }),
    [session, signOut],
  );

  const value = useMemo(() => ({ session, notice, signIn, signOut }), [session, notice, signIn, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}

/** For workspace screens, which are only rendered while signed in. */
export function useToken(): string {
  const { session } = useSession();
  return session?.token ?? "";
}
