import type { Channel, ServerSettings, SocketEndpoint } from "../../types";

/** Release shown in the UI and returned by `/healthz`. */
export const RELEASE = "2.0.0";

const DEFAULT_API = "https://ts.idicorp.ir";

/** Environment variables this module understands. */
type Env = Record<string, string | undefined>;

/**
 * Validates the HTTP origin of the backend.
 * Only a bare origin is accepted so a typo cannot leak credentials or paths.
 */
function parseHttpOrigin(value: string): URL {
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(
      "API_BASE_URL must be an HTTP(S) origin without credentials, a path, or a query.",
    );
  return url;
}

/**
 * Resolves one WebSocket endpoint. An explicit value wins; otherwise the
 * documented path is derived from the HTTP origin (https → wss, http → ws).
 */
function resolveSocketUrl(explicit: string | undefined, path: string, http: URL) {
  const url = explicit ? new URL(explicit) : new URL(path, http);
  if (!explicit) url.protocol = http.protocol === "https:" ? "wss:" : "ws:";
  if (
    !["ws:", "wss:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(
      "WebSocket endpoints must use ws:// or wss:// without credentials, query, or fragment.",
    );
  return url.href;
}

/**
 * Reads and validates all runtime settings from the environment.
 * Shared by the custom server (WebSocket bridge), the API route handler and
 * the root layout (which passes the public part to the browser).
 */
export function readSettings(env: Env = process.env): ServerSettings {
  const http = parseHttpOrigin(env.API_BASE_URL || DEFAULT_API);
  const sockets: Record<Channel, SocketEndpoint> = {
    calculator: {
      path: "/ws/calculator",
      upstream: resolveSocketUrl(env.CALCULATOR_WS_URL, "/ws/calculator", http),
    },
    echo: {
      path: "/ws/echo",
      upstream: resolveSocketUrl(env.ECHO_WS_URL, "/ws/echo", http),
    },
  };
  return {
    httpTarget: http.origin,
    sockets,
    client: { release: RELEASE, httpOrigin: http.origin, sockets },
  };
}
