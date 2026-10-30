/**
 * Same-origin proxy for every backend HTTP route (`/api/*`).
 *
 * The backend sets HTTP-only session cookies for its own domain; proxying keeps
 * the browser on one origin so those cookies are stored and sent back without
 * CORS. Responses are streamed back as they arrive (the streaming echo relies
 * on this). Request bodies are buffered as a Blob: with a streamed or
 * ArrayBuffer body, Node's fetch (undici) throws on any 401 reply, which would
 * hide "wrong CAPTCHA" and "session expired" answers behind a fake 502.
 */
import type { NextRequest } from "next/server";
import { readSettings } from "@/lib/config/settings";
import {
  forwardRequestHeaders,
  forwardResponseHeaders,
  isSameOrigin,
  isSecureContext,
  rewriteSetCookie,
} from "@/lib/gateway/proxyHeaders";

export const dynamic = "force-dynamic";

const UPSTREAM_TIMEOUT_MS = 25_000;
/** Largest request body forwarded (the UI sends at most ~400 KB). */
const MAX_REQUEST_BYTES = 2 * 1024 * 1024;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const json = (status: number, detail: string) =>
  Response.json({ detail }, { status, headers: { "Cache-Control": "no-store" } });

async function proxy(request: NextRequest): Promise<Response> {
  // Cross-site browsers may not trigger writes through this proxy.
  if (
    !SAFE_METHODS.has(request.method) &&
    !isSameOrigin(request.headers.get("origin"), request.headers.get("host"))
  )
    return json(403, "Cross-origin request rejected.");

  const { httpTarget } = readSettings();
  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, httpTarget);
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.blob();
  if (body && body.size > MAX_REQUEST_BYTES) return json(413, "Request body is too large.");

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers: forwardRequestHeaders(request.headers),
      body,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)]),
    });
  } catch {
    return json(502, "The upstream service is unavailable.");
  }

  const headers = forwardResponseHeaders(upstream.headers);
  const secure = isSecureContext(request.nextUrl, request.headers.get("x-forwarded-proto"));
  for (const cookie of upstream.headers.getSetCookie())
    headers.append("Set-Cookie", rewriteSetCookie(cookie, secure));

  return new Response(upstream.body, { status: upstream.status, headers });
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
  proxy as HEAD,
  proxy as OPTIONS,
};
