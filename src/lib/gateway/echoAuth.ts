/**
 * Server half of the echo authentication envelope (see realtime/echoProtocol.ts).
 * Validates the subprotocol envelope and converts it into an upstream
 * `Authorization: Bearer` header. Malformed input is rejected before anything
 * is forwarded, which also blocks header-injection attempts.
 */
import type { IncomingMessage } from "node:http";
import { ECHO_PROTOCOL, TOKEN_PREFIX } from "../realtime/echoProtocol";
import { MAX_TOKEN_LENGTH, TOKEN_PATTERN } from "../api/contracts";

export class EchoAuthError extends Error {
  constructor() {
    super("Invalid echo authentication envelope");
    this.name = "EchoAuthError";
  }
}

/**
 * Decodes the envelope from a `Sec-WebSocket-Protocol` header value.
 * Returns null when the client did not use the envelope (native clients may
 * send Authorization themselves); throws EchoAuthError when it is malformed.
 */
export function decodeEchoEnvelope(header: string | string[] | undefined): string | null {
  const offered = String(header ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!offered.includes(ECHO_PROTOCOL)) return null;
  if (offered.length !== 2) throw new EchoAuthError();
  const encoded = offered.find((p) => p.startsWith(TOKEN_PREFIX))?.slice(TOKEN_PREFIX.length);
  if (!encoded || encoded.length > 11_000 || !/^[A-Za-z0-9_-]+$/.test(encoded))
    throw new EchoAuthError();
  const token = Buffer.from(encoded, "base64url").toString("ascii");
  // Re-encoding must give back the exact input: rejects non-canonical payloads.
  if (
    !token ||
    token.length > MAX_TOKEN_LENGTH ||
    !TOKEN_PATTERN.test(token) ||
    Buffer.from(token, "ascii").toString("base64url") !== encoded
  )
    throw new EchoAuthError();
  return token;
}

/**
 * Rewrites an incoming upgrade request in place: sets Authorization and
 * removes the credential-bearing subprotocol. Returns the protocol name the
 * gateway must select back to the browser, or null if no envelope was used.
 */
export function applyEchoAuth(req: IncomingMessage): string | null {
  const token = decodeEchoEnvelope(req.headers["sec-websocket-protocol"]);
  if (token === null) return null;
  req.headers.authorization = `Bearer ${token}`;
  delete req.headers["sec-websocket-protocol"];
  return ECHO_PROTOCOL;
}
