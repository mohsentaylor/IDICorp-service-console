/**
 * Where the browser sends API calls.
 *
 * - Normal (server) mode: empty, so calls go to the same-origin `/api` proxy
 *   and `/ws/*` bridge run by server.ts.
 * - Static export (GitHub Pages): set at build time through
 *   NEXT_PUBLIC_DIRECT_API_ORIGIN; the browser then talks to the backend
 *   directly. Next.js inlines this value into the bundle during the build.
 */
export const DIRECT_API_ORIGIN = process.env.NEXT_PUBLIC_DIRECT_API_ORIGIN ?? "";

/** True when the app was built as a static site without the local server. */
export const isDirectMode = DIRECT_API_ORIGIN !== "";

/** Prefixes an `/api/...` path with the backend origin in static mode. */
export const apiUrl = (path: string) => `${DIRECT_API_ORIGIN}${path}`;
