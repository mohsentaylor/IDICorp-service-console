/**
 * The two transports the app talks through: HTTP (`fetch`) and WebSocket.
 *
 * Normal and direct builds use the browser's own implementations. The static
 * demo build (NEXT_PUBLIC_DEMO_MODE=1) swaps in the in-browser demo backend, so
 * every screen works with no server at all. Hooks and services never know which
 * one they use (dependency inversion).
 */
import { demoFetch } from "@/lib/demo/demoBackend";
import { DemoSocket } from "@/lib/demo/demoSocket";

export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

/** Looked up at call time so unit tests can stub the global fetch. */
export const transportFetch = (input: string, init?: RequestInit): Promise<Response> =>
  isDemoMode ? demoFetch(input, init) : fetch(input, init);

export const openSocket = (url: string, protocols?: string[]): WebSocket =>
  isDemoMode ? (new DemoSocket(url, protocols) as unknown as WebSocket) : new WebSocket(url, protocols);
