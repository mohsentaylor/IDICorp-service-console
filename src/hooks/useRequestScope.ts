"use client";
import { useEffect, useRef } from "react";

/**
 * Gives a screen an AbortSignal that is aborted when the screen unmounts, so
 * pending requests never update state of a component that is gone.
 * (Re-created after React StrictMode's development mount/unmount replay.)
 */
export function useRequestScope() {
  const scope = useRef(new AbortController());
  useEffect(() => {
    if (scope.current.signal.aborted) scope.current = new AbortController();
    const controller = scope.current;
    return () => controller.abort();
  }, []);
  return scope;
}
