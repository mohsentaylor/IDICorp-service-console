"use client";
import { useConfig } from "@/providers/ConfigProvider";
import { isDemoMode } from "@/lib/config/transport";
import { Button } from "./Button";
import type { Channel, SocketState } from "@/types";

/** Live connection indicator for a WebSocket tool, with a reconnect action. */
export function ConnectionStatus({
  channel,
  state,
  onReconnect,
}: {
  channel: Channel;
  state: SocketState;
  onReconnect: () => void;
}) {
  const { sockets } = useConfig();
  const live = state === "Connected";
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-line-soft pb-[18px] text-[11px] text-[#8d9686]">
        <span aria-hidden="true" className={`shrink-0 text-[8px] ${live ? "text-[#78a36a]" : "text-[#c49951]"}`}>
          ●
        </span>
        <span role="status">{state}</span>
        <Button variant="quiet" className="ml-auto" onClick={onReconnect}>
          Reconnect
        </Button>
      </div>
      <p className="-mt-2.5 mb-[22px] text-[11px] text-muted">
        <strong className="block font-medium">{isDemoMode ? "Demo WebSocket" : "Backend WebSocket"}</strong>
        <code className="mt-1.5 block text-[#345e4a] wrap-anywhere">
          {isDemoMode ? `in-browser ${sockets[channel].path}` : sockets[channel].upstream}
        </code>
      </p>
      {!live && state !== "Connecting" && (
        <p className="my-3.5 text-xs leading-[1.7] text-[#66735f]">
          {isDemoMode
            ? "The WebSocket connection is unavailable. Press Reconnect, or sign in again if the session ended."
            : "The WebSocket connection is unavailable. No result is calculated or echoed locally. Check your sign-in session and the configured service address, then retry."}
        </p>
      )}
    </>
  );
}
