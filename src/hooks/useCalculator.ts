"use client";
/**
 * Calculator tool logic. The backend has no request IDs, so only one
 * calculation may be in flight; late or unsolicited replies are ignored.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { parseCalculation } from "@/lib/api/contracts";
import { parseNumbers } from "@/lib/calculator/parseNumbers";
import { useSocket } from "./useSocket";
import type { CalculatorOperation } from "@/types";

export const RESULT_TIMEOUT_MS = 10_000;

export function useCalculator(token: string) {
  const [operation, setOperation] = useState<CalculatorOperation>("add");
  const [numbers, setNumbers] = useState("10, 20");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);

  /** Stops waiting for the current result. */
  const settle = () => {
    if (timer.current) clearTimeout(timer.current);
    inFlight.current = false;
    setPending(false);
  };

  const socket = useSocket("calculator", token, (data) => {
    if (!inFlight.current) return; // Unsolicited frame.
    settle();
    try {
      const reply = parseCalculation(data);
      if ("error" in reply) setError(reply.error);
      else setResult(String(reply.result));
    } catch {
      setError("The service returned an unreadable result.");
    }
  });

  // Any connection change invalidates the displayed result and pending work.
  useEffect(() => {
    if (socket.state === "Connected") return;
    setResult(null);
    if (inFlight.current) setError("The connection changed before a result arrived. Please calculate again.");
    settle();
  }, [socket.state]);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  function reconnect() {
    if (inFlight.current) setError("The previous calculation was cancelled. Please calculate again.");
    settle();
    socket.reconnect();
  }

  function calculate(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    setError("");
    setResult(null);
    const parsed = parseNumbers(numbers, operation);
    if (!parsed.ok) return setError(parsed.error);
    if (!socket.send(JSON.stringify({ operation, numbers: parsed.values })))
      return setError("Connect to the service before calculating.");
    inFlight.current = true;
    setPending(true);
    timer.current = setTimeout(() => {
      settle();
      setError("No result received. Reconnect before retrying.");
      socket.reconnect();
    }, RESULT_TIMEOUT_MS);
  }

  return {
    operation,
    setOperation,
    numbers,
    setNumbers,
    result,
    error,
    pending,
    calculate,
    reconnect,
    connection: socket.state,
  };
}
