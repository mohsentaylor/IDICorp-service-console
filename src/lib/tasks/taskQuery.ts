import type { TaskQuery } from "@/types";

/** Tasks expire this long after their latest update (backend contract). */
export const TASK_TTL_MS = 60 * 60 * 1000;

/** Builds the query string for `GET /api/tasks`. */
export function buildTaskSearchParams({ search, filter }: TaskQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (filter !== "all") params.set("completed", String(filter === "completed"));
  return params;
}

/** Estimated expiry time; the server remains authoritative. */
export function estimateExpiry(updatedAt: string): Date {
  return new Date(new Date(updatedAt).getTime() + TASK_TTL_MS);
}
