import type { ReactNode } from "react";

/** Centered placeholder for loading, empty and error states. */
export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="px-6 py-14 text-center text-[13px] text-[#93a08b]">{children}</div>;
}
