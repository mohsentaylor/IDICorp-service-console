/**
 * Decoupled "session expired" signal.
 * Low-level code (HTTP client, sockets) raises it with the token that failed;
 * the SessionProvider only reacts when that token is still the current one, so
 * a late 401 from an old login can never sign out a newer session.
 */
export const SESSION_EXPIRED = "idicorp:session-expired";

export function expireSession(token: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<string>(SESSION_EXPIRED, { detail: token }));
}

export function onSessionExpired(listener: (token: string) => void) {
  const handler = (event: Event) => listener((event as CustomEvent<string>).detail);
  window.addEventListener(SESSION_EXPIRED, handler);
  return () => window.removeEventListener(SESSION_EXPIRED, handler);
}
