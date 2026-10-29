"use client";
import { useConfig } from "@/providers/ConfigProvider";

/** Shows which backend the console talks to, so evaluators can verify it. */
export function ServiceBanner() {
  const { release, httpOrigin } = useConfig();
  return (
    <div role="note" className="mb-6 rounded-lg border border-[#d4e1d5] bg-[#eef5ec] px-4 py-3 text-[11px] wrap-anywhere">
      <strong className="block text-xs">Backend mode · v{release}</strong>
      <span className="mt-1 block text-[#52684c]">
        {httpOrigin} · CAPTCHA, sign-in and tool results are returned by this backend.
      </span>
    </div>
  );
}
