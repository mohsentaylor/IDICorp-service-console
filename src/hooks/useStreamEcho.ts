"use client";
/** Streaming echo tool: one stream at a time, cancellable, 30-second deadline. */
import { useRef, useState, type FormEvent } from "react";
import { errorMessage } from "@/lib/api/httpClient";
import { readUtf8Stream } from "@/lib/stream/readUtf8Stream";
import { streamService } from "@/services/streamService";
import { useRequestScope } from "./useRequestScope";
import type { StreamStatus } from "@/types";

export const STREAM_TIMEOUT_MS = 30_000;

export function useStreamEcho(token: string) {
  const scope = useRequestScope();
  const [text, setText] = useState("Hello, IDICorp!");
  const [output, setOutput] = useState("");
  const [bytes, setBytes] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<StreamStatus>("Ready");
  const current = useRef<AbortController | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (current.current) return;
    const controller = new AbortController();
    current.current = controller;
    const signal = AbortSignal.any([controller.signal, scope.current.signal]);
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, STREAM_TIMEOUT_MS);
    setBusy(true);
    setError("");
    setOutput("");
    setBytes(0);
    setStatus("Receiving");

    try {
      const body = await streamService.open(token, text, signal);
      await readUtf8Stream(body, signal, (content, size) => {
        if (scope.current.signal.aborted) return;
        setOutput(content);
        setBytes(size);
      });
      setStatus("Complete");
    } catch (e) {
      if (scope.current.signal.aborted) return; // Screen left: nothing to show.
      if (controller.signal.aborted) {
        setStatus(timedOut ? "Timed out" : "Cancelled");
        if (timedOut) setError("The stream timed out. Please retry.");
      } else {
        setStatus("Failed");
        setError(errorMessage(e));
      }
    } finally {
      clearTimeout(timeout);
      current.current = null;
      if (!scope.current.signal.aborted) setBusy(false);
    }
  }

  return { text, setText, output, bytes, busy, error, status, submit, cancel: () => current.current?.abort() };
}
