"use client";
import { useConfig } from "@/providers/ConfigProvider";
import { isDemoMode } from "@/lib/config/transport";

/** Shows which backend the console talks to, so evaluators can verify it. */
export function ServiceBanner() {
  const { release, httpOrigin } = useConfig();
  if (isDemoMode)
    return (
      <div role="note" className="mb-6 rounded-lg border border-[#ead9a8] bg-[#fbf6e6] px-4 py-3 text-[11px] wrap-anywhere">
        <strong className="block text-xs">Demo mode · v{release}</strong>
        <span className="mt-1 block text-[#6f5d22]">
          Runs entirely in your browser: CAPTCHA, sign-in, tasks and tools are served by a built-in demo
          service that follows the IDICorp API contract. Data resets when the page reloads.
        </span>
      </div>
    );
  return (
    <div role="note" className="mb-6 rounded-lg border border-[#d4e1d5] bg-[#eef5ec] px-4 py-3 text-[11px] wrap-anywhere">
      <strong className="block text-xs">Backend mode · v{release}</strong>
      <span className="mt-1 block text-[#52684c]">
        {httpOrigin} · CAPTCHA, sign-in and tool results are returned by this backend.
      </span>
    </div>
  );
}
