"use client";
/**
 * Sign-in flow: loads a CAPTCHA challenge from the backend, submits the exact
 * salt with the user's typed answer, and refreshes the challenge after a failure
 * (each challenge is single-use). Nothing is pre-filled or computed locally.
 */
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { errorMessage } from "@/lib/api/httpClient";
import { authService } from "@/services/authService";
import { useRequestScope } from "./useRequestScope";
import type { Captcha, Session } from "@/types";

export function useLogin(onSuccess: (session: Session) => void) {
  const scope = useRequestScope();
  const challenge = useRef<AbortController | null>(null);
  const submitLock = useRef(false);
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const refreshCaptcha = useCallback(
    async (clearError = true) => {
      challenge.current?.abort();
      const controller = new AbortController();
      challenge.current = controller;
      const signal = AbortSignal.any([scope.current.signal, controller.signal]);
      if (clearError) setError("");
      setLoading(true);
      setCaptcha(null);
      setAnswer("");
      try {
        const value = await authService.getCaptcha(signal);
        if (!signal.aborted) setCaptcha(value);
      } catch (e) {
        if (!signal.aborted) setError(errorMessage(e));
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [scope],
  );

  useEffect(() => {
    void refreshCaptcha();
  }, [refreshCaptcha]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!captcha || submitLock.current) return;
    submitLock.current = true;
    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") ?? "");
    const signal = scope.current.signal;
    setBusy(true);
    setError("");
    try {
      const { access_token } = await authService.login(
        { username, password: String(form.get("password") ?? ""), captcha_answer: answer, salt: captcha.salt },
        signal,
      );
      if (!signal.aborted) onSuccess({ token: access_token, username });
    } catch (e) {
      if (signal.aborted) return;
      setError(errorMessage(e));
      await refreshCaptcha(false);
    } finally {
      submitLock.current = false;
      if (!signal.aborted) setBusy(false);
    }
  }

  return { captcha, answer, setAnswer, error, loading, busy, submit, refreshCaptcha };
}
