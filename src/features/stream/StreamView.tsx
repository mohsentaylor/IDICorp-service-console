"use client";
/** Streaming echo screen: shows the response as bytes arrive. */
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FineText } from "@/components/ui/FineText";
import { ToolLayout } from "@/components/ui/Panel";
import { useStreamEcho } from "@/hooks/useStreamEcho";
import { useToken } from "@/providers/SessionProvider";

export function StreamView() {
  const stream = useStreamEcho(useToken());
  return (
    <ToolLayout title="Streaming echo" eyebrow="FOLLOW THE FLOW" description="Send UTF-8 text and read the response as bytes arrive.">
      <form onSubmit={stream.submit}>
        <label>
          Content to stream
          <textarea
            rows={6}
            value={stream.text}
            onChange={(e) => stream.setText(e.target.value)}
            maxLength={100000}
            required
            disabled={stream.busy}
          />
        </label>
        <FineText>Up to 100,000 characters. Network chunks may arrive together for short responses.</FineText>
        <Alert text={stream.error} />
        <div className="mt-5 flex justify-end gap-3">
          {stream.busy && <Button onClick={stream.cancel}>Cancel stream</Button>}
          <Button type="submit" variant="primary" disabled={stream.busy || !stream.text.length}>
            {stream.busy ? "Streaming…" : "Start stream →"}
          </Button>
        </div>
      </form>
      <div className="mt-[25px] mb-[22px] flex items-center justify-between gap-3">
        <h2 className="text-[15px]">Returned content</h2>
        <span role="status" aria-live="polite" className="rounded-[5px] bg-[#faf5e5] px-[7px] py-[3px] text-[9px] text-[#7e6a2b]">
          {stream.status} · {stream.bytes} bytes
        </span>
      </div>
      <pre
        aria-label="Returned stream content"
        className="max-h-[450px] min-h-[140px] overflow-auto rounded-lg border border-[#e4eade] bg-[#f5f8f1] p-5 text-[13px] whitespace-pre-wrap wrap-anywhere"
      >
        {stream.output || "The returned content will appear here."}
      </pre>
    </ToolLayout>
  );
}
