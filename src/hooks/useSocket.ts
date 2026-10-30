"use client";
/**
 * Owns one WebSocket connection to a backend tool through the same-origin
 * bridge, and exposes its state, a guarded `send` and `reconnect`.
 *
 * Protocol rules:
 * - calculator: the token is sent as the first JSON frame on open;
 * - echo: the token travels in the handshake (subprotocol envelope);
 * - the first `{"type":"ready"}` frame marks the connection usable. After it,
 *   every frame is delivered to `onMessage` (even JSON that looks like control).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useConfig } from "@/providers/ConfigProvider";
import { echoProtocols, sameOriginSocketUrl } from "@/lib/realtime/echoProtocol";
import { expireSession } from "@/lib/session/sessionEvents";
import { isDirectMode } from "@/lib/config/apiOrigin";
import { openSocket } from "@/lib/config/transport";
import type { Channel, SocketState } from "@/types";

export const CONNECT_TIMEOUT_MS = 10_000;

function parseJson(text: unknown): { type?: unknown; error?: unknown } | null {
  try {
    const value = JSON.parse(String(text));
    return typeof value === "object" && value !== null ? value : null;
  } catch {
    return null;
  }
}

export function useSocket(channel: Channel, token: string, onMessage: (data: string) => void) {
  const { sockets } = useConfig();
  const path = sockets[channel].path;
  // Static builds have no local bridge: connect straight to the backend.
  const url = isDirectMode ? sockets[channel].upstream : null;
  const [state, setState] = useState<SocketState>("Connecting");
  const [attempt, setAttempt] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const handler = useRef(onMessage);
  useEffect(() => {
    handler.current = onMessage;
  });

  useEffect(() => {
    let live = true;
    let ready = false;
    let ws: WebSocket | null = null;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    setState("Connecting");

    // Deferred so React StrictMode's setup/cleanup replay never opens a socket.
    const start = setTimeout(() => {
      const socket = openSocket(
        url ?? sameOriginSocketUrl(path, window.location),
        channel === "echo" ? echoProtocols(token) : undefined,
      );
      ws = socket;
      socketRef.current = socket;
      deadline = setTimeout(() => {
        if (live) setState("Connection timed out");
        socket.close();
      }, CONNECT_TIMEOUT_MS);

      socket.onopen = () => {
        if (!live) return socket.close(); // View unmounted during handshake.
        if (channel === "calculator") socket.send(JSON.stringify({ token }));
      };
      socket.onmessage = (event) => {
        if (!live) return;
        // Echo frames after "ready" are user content and are never interpreted.
        const data = ready && channel === "echo" ? null : parseJson(event.data);
        if (!ready && data?.type === "ready") {
          ready = true;
          clearTimeout(deadline);
          setState("Connected");
          return;
        }
        if (channel === "calculator" && data?.error === "Unauthorized") {
          clearTimeout(deadline);
          setState("Unauthorized");
          expireSession(token);
          return;
        }
        handler.current(String(event.data));
      };
      socket.onerror = () => {
        if (live) setState("Connection error");
      };
      socket.onclose = () => {
        clearTimeout(deadline);
        if (live) setState((s) => (s === "Connecting" || s === "Connected" ? "Disconnected" : s));
      };
    }, 0);

    return () => {
      live = false;
      clearTimeout(start);
      if (socketRef.current === ws) socketRef.current = null;
      // A socket still CONNECTING closes itself in onopen; its deadline stays
      // armed so a handshake that never completes is still cleaned up.
      if (!ws || ws.readyState !== WebSocket.CONNECTING) {
        clearTimeout(deadline);
        ws?.close();
      }
    };
  }, [path, url, channel, token, attempt]);

  const send = useCallback(
    (data: string) => {
      const socket = socketRef.current;
      if (socket?.readyState !== WebSocket.OPEN || state !== "Connected") return false;
      try {
        socket.send(data);
        return true;
      } catch {
        setState("Disconnected");
        return false;
      }
    },
    [state],
  );

  const reconnect = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, send, reconnect };
}
