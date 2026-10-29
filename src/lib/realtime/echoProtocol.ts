/**
 * Browser half of the echo authentication envelope.
 *
 * The echo WebSocket requires `Authorization: Bearer <token>` in the opening
 * handshake, but the browser WebSocket API cannot set headers. The browser
 * therefore offers two subprotocols: a fixed protocol name plus the token
 * encoded as base64url. The same-origin gateway (see lib/gateway/echoAuth.ts)
 * turns that envelope into the real header and strips it before forwarding.
 */
import { isValidToken } from "@/lib/api/contracts";

export const ECHO_PROTOCOL = "idicorp.echo.auth.v1";
export const TOKEN_PREFIX = "idicorp.token.";

export function toBase64Url(text: string): string {
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function echoProtocols(token: string): string[] {
  if (!isValidToken(token)) throw new Error("Invalid access token");
  return [ECHO_PROTOCOL, `${TOKEN_PREFIX}${toBase64Url(token)}`];
}

/** Builds the same-origin WebSocket URL for a gateway path. */
export function sameOriginSocketUrl(path: string, location: Pick<Location, "protocol" | "host">) {
  return `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}${path}`;
}
