"use client";
/**
 * Accessible modal built on the native <dialog> element:
 * focus is trapped by the browser, Escape closes it (unless busy), and focus
 * returns to the element that opened it.
 * Mark the element that should receive initial focus with `data-autofocus`
 * (React's autoFocus runs before showModal() and would be overridden).
 */
import { useEffect, useRef, type ReactNode } from "react";

export function Dialog({
  labelledBy,
  busy,
  onClose,
  children,
}: {
  labelledBy: string;
  busy: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    element?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => {
      element?.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="m-auto w-[min(530px,calc(100%-32px))] rounded-[14px] border border-[#dbe4d6] p-7 text-[#294638] shadow-[0_20px_100px_#193f3533]"
    >
      {children}
    </dialog>
  );
}
