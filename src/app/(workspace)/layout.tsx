"use client";
/**
 * Shell shared by every signed-in screen.
 * Acts as the auth guard: without an in-memory session the user is sent to
 * /login, and the screens below are never mounted (so they never call the API).
 */
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/providers/SessionProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ServiceBanner } from "@/components/layout/ServiceBanner";
import { useConfig } from "@/providers/ConfigProvider";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const { release } = useConfig();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!session) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [session, router, pathname]);

  if (!session) return <p className="p-8" role="status">Redirecting to sign-in…</p>;

  return (
    <div className="min-h-dvh md:flex">
      <a
        href="#content"
        className="fixed -top-24 left-3 z-10 bg-white p-3 focus:top-3"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="md:ml-[210px] md:w-[calc(100%-210px)] xl:ml-[246px] xl:w-[calc(100%-246px)]">
        <TopBar />
        <main
          id="content"
          tabIndex={-1}
          className="mx-auto max-w-[1440px] px-[18px] pt-7 pb-[18px] outline-none md:px-[26px] md:pt-8 xl:px-12 xl:pt-[42px]"
        >
          <ServiceBanner />
          {children}
          <footer className="flex justify-between pt-8 text-[10px] text-[#a4ad9f]">
            IDICorp <span>Service console / v{release}</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
