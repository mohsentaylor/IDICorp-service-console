"use client";
/** Text echo tool: keeps the last 100 sent/received messages. */
import { useRef, useState, type FormEvent } from "react";
import { useSocket } from "./useSocket";
import type { EchoEntry } from "@/types";

export const MAX_ECHO_ENTRIES = 100;

export function useEcho(token: string) {
  const [entries, setEntries] = useState<EchoEntry[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const nextId = useRef(0);

  const append = (kind: EchoEntry["kind"], value: string) =>
    setEntries((list) => [...list.slice(-(MAX_ECHO_ENTRIES - 1)), { id: nextId.current++, kind, text: value }]);

  const socket = useSocket("echo", token, (data) => append("Received", data));

  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!socket.send(text)) return setError("The connection is unavailable. Reconnect and retry.");
    append("Sent", text);
    setText("");
  }

  return { entries, clear: () => setEntries([]), text, setText, error, submit, socket };
}
