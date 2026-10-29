/**
 * Pure helpers used by the `/api/*` route handler to proxy HTTP calls.
 * Kept free of Next.js imports so they can be unit-tested in isolation.
 */

/** Hop-by-hop and recomputed headers that must not be forwarded. */
const STRIPPED_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "content-length",
  "accept-encoding",
  "proxy-authorization",
  "te",
  "trailer",
]);

/**
 * `fetch` already decompresses the upstream body, so encoding and length
 * headers would be wrong if passed through. Cookies are handled separately.
 */
const STRIPPED_RESPONSE_HEADERS = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "content-encoding",
  "content-length",
  "set-cookie",
  "strict-transport-security",
  "cross-origin-embedder-policy",
  "cross-origin-opener-policy",
]);

export function forwardRequestHeaders(incoming: Headers): Headers {
  const headers = new Headers();
  incoming.forEach((value, key) => {
    if (!STRIPPED_REQUEST_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  });
  return headers;
}

export function forwardResponseHeaders(upstream: Headers): Headers {
  const headers = new Headers();
  upstream.forEach((value, key) => {
    if (!STRIPPED_RESPONSE_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  });
  headers.set("Cache-Control", "no-store");
  return headers;
}

/**
 * Makes a backend cookie valid for this console's origin:
 * - drops `Domain` so the cookie binds to the console host;
 * - forces `Path=/`;
 * - on plain HTTP (e.g. another device on the LAN) drops `Secure`, and
 *   downgrades `SameSite=None` (which requires Secure) to `Lax`. Without this
 *   the browser silently discards the session cookies and every call is 401.
 */
export function rewriteSetCookie(cookie: string, secureContext: boolean): string {
  const [pair, ...attributes] = cookie.split(";").map((part) => part.trim());
  const kept: string[] = [];
  for (const attribute of attributes) {
    const name = attribute.split("=")[0].trim().toLowerCase();
    if (name === "domain" || name === "path") continue;
    if (!secureContext && name === "secure") continue;
    if (!secureContext && name === "samesite" && /none/i.test(attribute)) {
      kept.push("SameSite=Lax");
      continue;
    }
    if (attribute) kept.push(attribute);
  }
  return [pair, "Path=/", ...kept].join("; ");
}

/** A request is in a secure context if it is HTTPS or targets localhost. */
export function isSecureContext(url: URL, forwardedProto: string | null): boolean {
  if ((forwardedProto ?? url.protocol.replace(":", "")) === "https") return true;
  return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
}

/**
 * Same-origin check for state-changing requests and WebSocket upgrades.
 * Requests without Origin (CLI tools) are allowed; browsers always send it.
 */
export function isSameOrigin(origin: string | null | undefined, host: string | null | undefined) {
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    return ["http:", "https:"].includes(parsed.protocol) && parsed.host === host;
  } catch {
    return false;
  }
}
