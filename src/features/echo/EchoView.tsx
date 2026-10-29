"use client";
/** Text echo screen: a two-way WebSocket conversation log. */
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConnectionStatus } from "@/components/ui/ConnectionStatus";
import { ToolLayout } from "@/components/ui/Panel";
import { useEcho } from "@/hooks/useEcho";
import { useToken } from "@/providers/SessionProvider";

export function EchoView() {
  const echo = useEcho(useToken());
  return (
    <ToolLayout title="Text echo" eyebrow="A TWO-WAY CONNECTION" description="Send a message. Watch it come back on the same connection.">
      <ConnectionStatus channel="echo" state={echo.socket.state} onReconnect={echo.socket.reconnect} />
      <div role="log" aria-label="Echo conversation" className="mb-6 h-[290px] overflow-auto rounded-lg border border-[#e9eee3] bg-[#f7f9f5] p-[18px]">
        {echo.entries.length ? (
          echo.entries.map((entry) => (
            <div
              key={entry.id}
              className={`mb-3 w-fit max-w-[85%] rounded-lg border border-[#e4eade] px-3.5 py-2.5 wrap-anywhere ${
                entry.kind === "Sent" ? "ml-auto bg-[#e7efdf]" : "bg-white"
              }`}
            >
              <small className="text-[9px] text-[#8a997f]">{entry.kind}</small>
              <p className="my-1 text-xs whitespace-pre-wrap">{entry.text}</p>
            </div>
          ))
        ) : (
          <div className="px-6 py-14 text-center text-[13px] text-[#93a08b]">Your conversation starts here.</div>
        )}
      </div>
      <Alert text={echo.error} />
      <form onSubmit={echo.submit}>
        <label>
          Message
          <textarea value={echo.text} onChange={(e) => echo.setText(e.target.value)} maxLength={10000} required rows={3} />
        </label>
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button onClick={echo.clear}>Clear history</Button>
          <Button type="submit" variant="primary" disabled={echo.socket.state !== "Connected" || !echo.text.trim()}>
            Send message →
          </Button>
        </div>
      </form>
    </ToolLayout>
  );
}
