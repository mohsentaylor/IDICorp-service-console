import type { ReactNode } from "react";

/** Small uppercase label shown above headings. */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`text-[10px] font-bold tracking-[2px] text-[#74877c] ${className}`}>{children}</span>;
}
