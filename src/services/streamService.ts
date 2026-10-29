/** Streaming echo: sends text and exposes the raw response body stream. */
import { ApiError } from "@/types";
import { expireSession } from "@/lib/session/sessionEvents";

export const streamService = {
  async open(token: string, text: string, signal: AbortSignal): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch("/api/echo/stream", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain; charset=utf-8",
      },
      body: text,
      signal,
    });
    if (response.status === 401) {
      expireSession(token);
      throw new ApiError("Your session expired.", 401);
    }
    if (!response.ok) throw new ApiError(`Streaming service failed (${response.status}).`, response.status);
    if (!response.body) throw new ApiError("Streaming is unavailable in this browser.");
    return response.body;
  },
};
