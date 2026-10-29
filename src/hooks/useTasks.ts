"use client";
/**
 * State and behaviour of the task workspace, separated from its markup.
 *
 * - The list is re-fetched (debounced) when search/filter change, and
 *   periodically while the tab is visible and nothing is being edited.
 * - List errors and mutation errors are kept apart so a failed save never
 *   hides the list, and vice versa.
 * - Mutations are never retried automatically: a cancelled request may still
 *   have changed data on the server.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage, isUncertainFailure } from "@/lib/api/httpClient";
import { taskService } from "@/services/taskService";
import { useRequestScope } from "./useRequestScope";
import type { Task, TaskFilter } from "@/types";

export const SEARCH_DEBOUNCE_MS = 250;
export const POLL_INTERVAL_MS = 60_000;
const MIN_REFRESH_GAP_MS = 10_000;

export function useTasks(token: string) {
  const scope = useRequestScope();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [mutationError, setMutationError] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [revision, setRevision] = useState(0);
  /** Pauses background refresh while a dialog is open. */
  const [paused, setPaused] = useState(false);
  const mutationLock = useRef(false);

  const refresh = useCallback(() => setRevision((n) => n + 1), []);

  // Fetch the list; a newer query cancels the previous request.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setListError("");
    const timer = setTimeout(async () => {
      try {
        const data = await taskService.list(token, { search, filter }, controller.signal);
        if (!controller.signal.aborted) setTasks(data);
      } catch (error) {
        if (!controller.signal.aborted) setListError(errorMessage(error));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [token, search, filter, revision]);

  // Background reconciliation: tasks expire server-side after one hour.
  useEffect(() => {
    let last = 0;
    const maybeRefresh = () => {
      if (document.visibilityState !== "visible" || busy || paused) return;
      if (Date.now() - last <= MIN_REFRESH_GAP_MS) return;
      last = Date.now();
      refresh();
    };
    const timer = setInterval(maybeRefresh, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", maybeRefresh);
    window.addEventListener("focus", maybeRefresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", maybeRefresh);
      window.removeEventListener("focus", maybeRefresh);
    };
  }, [busy, paused, refresh]);

  /**
   * Runs one mutation at a time. Resolves true on success.
   * The ref lock blocks double submits within the same tick.
   */
  const mutate = useCallback(
    async (action: (signal: AbortSignal) => Promise<unknown>, success: string) => {
      if (mutationLock.current) return false;
      mutationLock.current = true;
      setBusy(true);
      setMutationError("");
      const signal = scope.current.signal;
      try {
        await action(signal);
        if (signal.aborted) return false;
        setFeedback(success);
        refresh();
        return true;
      } catch (error) {
        if (!signal.aborted)
          setMutationError(
            errorMessage(error) +
              (isUncertainFailure(error)
                ? " The change may have reached the service. Refresh before retrying."
                : ""),
          );
        return false;
      } finally {
        mutationLock.current = false;
        if (!signal.aborted) setBusy(false);
      }
    },
    [scope, refresh],
  );

  return {
    tasks,
    search,
    setSearch,
    filter,
    setFilter,
    loading,
    listError,
    mutationError,
    clearMutationError: () => setMutationError(""),
    busy,
    feedback,
    refresh,
    setPaused,
    mutate,
  };
}
