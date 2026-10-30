/**
 * Single entry point for HTTP calls to the backend (through the same-origin
 * `/api` proxy). It owns: auth header, cookies, timeout, cancellation,
 * error-message mapping and optional response validation.
 */
import { ApiError } from "@/types";
import { expireSession } from "@/lib/session/sessionEvents";
import { apiUrl } from "@/lib/config/apiOrigin";
import { transportFetch } from "@/lib/config/transport";

export const REQUEST_TIMEOUT_MS = 20_000;

/** Friendly fallbacks used when the backend error body has no detail. */
function fallbackMessage(status: number, authenticated: boolean): string {
  const messages: Record<number, string> = {
    401: authenticated
      ? "Your session expired. Please sign in again."
      : "Sign-in failed. Check your credentials and CAPTCHA.",
    403: "The request was not permitted.",
    404: "This task no longer exists. It may have expired.",
    422: "Please check the entered values.",
    502: "The upstream service is unavailable. Please retry.",
    503: "Task storage is temporarily unavailable. Please retry.",
  };
  return messages[status] ?? `Service request failed (${status}).`;
}

/** Extracts a readable message from FastAPI-style error bodies. */
export function extractDetail(body: unknown): string {
  if (typeof body !== "object" || body === null) return "";
  const { detail, error } = body as { detail?: unknown; error?: unknown };
  if (typeof detail === "string") return detail;
  if (typeof error === "string") return error;
  if (Array.isArray(detail))
    return detail
      .map((entry) =>
        typeof entry === "object" && entry && typeof entry.msg === "string" ? entry.msg : "",
      )
      .filter(Boolean)
      .join("; ");
  return "";
}

export interface RequestOptions<T> extends RequestInit {
  /** Bearer token; empty for anonymous calls such as sign-in. */
  token?: string;
  /** Runtime validator for the JSON body. */
  decode?: (value: unknown) => T;
}

export async function request<T = void>(path: string, options: RequestOptions<T> = {}): Promise<T> {
  const { token = "", decode, signal: outer, ...init } = options;
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);
  const signal = outer ? AbortSignal.any([outer, timeout.signal]) : timeout.signal;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  try {
    const response = await transportFetch(apiUrl(path), {
      ...init,
      cache: "no-store",
      credentials: "include",
      signal,
      headers,
    });
    signal.throwIfAborted();

    if (!response.ok) {
      if (response.status === 401 && token) expireSession(token);
      const detail = extractDetail(await response.json().catch(() => null));
      signal.throwIfAborted();
      throw new ApiError(
        detail.slice(0, 500) || fallbackMessage(response.status, Boolean(token)),
        response.status,
      );
    }
    if (response.status === 204) return undefined as T;

    try {
      const data: unknown = await response.json();
      signal.throwIfAborted();
      return decode ? decode(data) : (data as T);
    } catch (error) {
      if (signal.aborted) throw error;
      throw new ApiError("The service returned an invalid response. Please retry.", response.status);
    }
  } catch (error) {
    // Caller cancellation is not an error to report: re-throw its reason.
    if (outer?.aborted) throw outer.reason;
    if (timeout.signal.aborted) throw new ApiError("The request timed out. Please retry.");
    if (error instanceof ApiError) throw error;
    throw new ApiError("Cannot reach the service. Check your connection and retry.");
  } finally {
    clearTimeout(timer);
  }
}

/** Converts any thrown value into a message suitable for the UI. */
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please retry.";

/**
 * True when a mutation failed without a definitive answer (network loss,
 * timeout, unreadable body): the change may still have reached the server.
 */
export const isUncertainFailure = (error: unknown) =>
  error instanceof ApiError && (error.status === 0 || error.status === 200);
