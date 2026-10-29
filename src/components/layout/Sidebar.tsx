"use client";
/** Workspace navigation, user profile and sign-out. Collapses on phones. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { VIEWS, viewForPath } from "@/lib/navigation/views";
import { useSession } from "@/providers/SessionProvider";
import { Brand } from "./Brand";

export function Sidebar() {
  const pathname = usePathname();
  const active = viewForPath(pathname).id;
  const { session, signOut } = useSession();
  const username = session?.username ?? "";

  return (
    <aside className="relative flex flex-col border-line bg-white px-5 py-[18px] max-md:border-b md:fixed md:inset-y-0 md:left-0 md:w-[210px] md:border-r md:px-4 md:py-7 xl:w-[246px] xl:px-[22px] xl:pt-8">
      <Link href="/tasks" aria-label="IDICorp home">
        <Brand />
      </Link>
      <p className="mx-3 mt-[52px] mb-[15px] text-[9px] font-bold tracking-[2px] text-[#99a49c] max-md:hidden">WORKSPACE</p>
      <nav aria-label="Main navigation" className="grid grid-cols-2 gap-1 max-md:mt-5 md:flex md:flex-col md:gap-1.5">
        {VIEWS.map((view) => {
          const current = view.id === active;
          return (
            <Link
              key={view.id}
              href={view.href}
              aria-current={current ? "page" : undefined}
              className={`flex items-center gap-1.5 rounded-lg p-2.5 text-[11px] md:gap-3 md:px-3 md:py-[13px] md:text-xs ${
                current ? "bg-mint font-semibold text-[#284b35]" : "font-medium text-[#7c8b82] hover:bg-[#f3f6f1]"
              }`}
            >
              <span aria-hidden="true" className="w-4 text-base leading-none md:w-[22px] md:text-[21px]">
                {view.icon}
              </span>
              {view.label}
              {current && (
                <b aria-hidden="true" className="ml-auto text-sm max-md:hidden">
                  ↗
                </b>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-3.5 pt-7 pb-[42px] max-md:hidden">
        <span aria-hidden="true" className="block text-[34px] text-[#9bad76]">◈</span>
        <strong className="mt-3 block text-xs">Built for your flow.</strong>
        <p className="my-1.5 text-[11px] leading-[1.8] text-[#99a298]">
          Everyday tools.
          <br />
          One connected workspace.
        </p>
      </div>
      <div className="flex items-center gap-2.5 max-md:absolute max-md:top-[18px] max-md:right-5 md:border-t md:border-[#e8ece5] md:pt-6">
        <span aria-hidden="true" className="grid size-[34px] place-items-center rounded-full bg-[#edf0e7] text-xs max-md:hidden">
          {username[0]?.toUpperCase()}
        </span>
        <div className="max-md:hidden">
          <strong className="block max-w-[100px] text-xs wrap-anywhere">{username}</strong>
          <small className="text-[10px] text-[#96a093]">Signed in</small>
        </div>
        <button
          type="button"
          onClick={() => signOut("You have signed out locally.")}
          aria-label="Sign out"
          className="ml-auto rounded-lg px-2.5 py-[7px] text-sm text-[#284d43] hover:bg-[#edf3ee]"
        >
          ↪
        </button>
      </div>
    </aside>
  );
}
