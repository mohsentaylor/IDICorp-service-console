/**
 * Task CRUD API calls, one method per backend route.
 * Mutation responses are not decoded: the list is re-fetched afterwards, and a
 * strict decode failure would wrongly report an applied change as failed.
 */
import { request } from "@/lib/api/httpClient";
import { parseTasks } from "@/lib/api/contracts";
import { buildTaskSearchParams } from "@/lib/tasks/taskQuery";
import type { Task, TaskInput, TaskPatch, TaskQuery } from "@/types";

export const taskService = {
  list(token: string, query: TaskQuery, signal?: AbortSignal): Promise<Task[]> {
    return request(`/api/tasks?${buildTaskSearchParams(query)}`, {
      token,
      signal,
      decode: parseTasks,
    });
  },

  create(token: string, input: TaskInput, signal?: AbortSignal): Promise<unknown> {
    return request("/api/tasks", {
      method: "POST",
      token,
      signal,
      body: JSON.stringify(input),
    });
  },

  replace(token: string, id: number, input: TaskInput, signal?: AbortSignal): Promise<unknown> {
    return request(`/api/tasks/${id}`, {
      method: "PUT",
      token,
      signal,
      body: JSON.stringify(input),
    });
  },

  update(token: string, id: number, patch: TaskPatch, signal?: AbortSignal): Promise<unknown> {
    return request(`/api/tasks/${id}`, {
      method: "PATCH",
      token,
      signal,
      body: JSON.stringify(patch),
    });
  },

  remove(token: string, id: number, signal?: AbortSignal): Promise<void> {
    return request(`/api/tasks/${id}`, { method: "DELETE", token, signal });
  },
};
