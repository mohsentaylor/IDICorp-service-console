import type { ReactNode } from "react";
import { PageIntro } from "./PageIntro";

/** White rounded card used for lists and tools. */
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`overflow-hidden rounded-xl border border-line bg-white shadow-[0_3px_5px_#173f3503] ${className}`}>
      {children}
    </section>
  );
}

/** Layout used by the three realtime tools: intro + padded panel. */
export function ToolLayout({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageIntro eyebrow={eyebrow} title={title} description={description} />
      <Panel className="max-w-[850px] p-[30px] max-md:p-5">{children}</Panel>
    </>
  );
}
