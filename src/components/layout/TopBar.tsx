"use client";
import { usePathname } from "next/navigation";
import { viewForPath } from "@/lib/navigation/views";

/** Breadcrumb header of the workspace. */
export function TopBar() {
  const title = viewForPath(usePathname()).label;
  return (
    <header className="flex h-[54px] items-center justify-between border-b border-[#e7ebe5] bg-white px-5 text-[11px] text-[#98a098] md:h-[78px] md:px-[26px] xl:px-12">
      <span>
        Workspace <span className="mx-4 text-[#c5cdc5]">/</span>
        <strong className="font-medium text-[#405648]">{title}</strong>
      </span>
      <span className="text-[8px] tracking-[1.6px] max-md:hidden">
        INTERNAL CONSOLE <i className="ml-4 text-[#8ba376] not-italic">●</i>
      </span>
    </header>
  );
}
