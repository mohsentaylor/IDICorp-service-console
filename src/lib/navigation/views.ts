import type { View } from "@/types";

/** Workspace screens: one entry per route under app/(workspace). */
export const VIEWS: { id: View; href: `/${View}`; label: string; icon: string }[] = [
  { id: "tasks", href: "/tasks", label: "Task workspace", icon: "▤" },
  { id: "calculator", href: "/calculator", label: "Calculator", icon: "±" },
  { id: "echo", href: "/echo", label: "Text echo", icon: "↔" },
  { id: "stream", href: "/stream", label: "Streaming echo", icon: "≋" },
];

export const viewForPath = (pathname: string) =>
  VIEWS.find((view) => pathname.startsWith(view.href)) ?? VIEWS[0];

/**
 * Where to go after sign-in. Only known workspace paths are accepted, so a
 * crafted `?next=` value can never redirect to another site.
 */
export function safeNextPath(search: string): string {
  // Static hosts add a trailing slash ("/calculator/"); compare without it.
  const next = new URLSearchParams(search).get("next")?.replace(/(.)\/+$/, "$1");
  return VIEWS.find((view) => view.href === next)?.href ?? "/tasks";
}
