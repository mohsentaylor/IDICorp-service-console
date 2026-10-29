import type { ReactNode } from "react";

/** Small helper text below form fields. */
export function FineText({ children }: { children: ReactNode }) {
  return <p className="my-3.5 text-xs leading-[1.7] text-[#66735f]">{children}</p>;
}
