/** Hard cap on streamed responses so a misbehaving upstream cannot exhaust memory. */
export const MAX_STREAM_BYTES = 1024 * 1024;
/** Minimum time between UI updates while chunks arrive. */
export const PUBLISH_INTERVAL_MS = 50;

/**
 * Reads a byte stream as UTF-8 text.
 * - Multibyte characters split across chunks are decoded correctly.
 * - UI updates are throttled; a final update is always published.
 * - The reader is cancelled and released on every exit path (done, error, abort).
 */
export async function readUtf8Stream(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  publish: (text: string, bytes: number) => void,
  now: () => number = () => performance.now(),
) {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let text = "";
  let bytes = 0;
  let lastPublished = -Infinity;
  const abort = () => void reader.cancel().catch(() => {});
  signal.addEventListener("abort", abort, { once: true });
  try {
    signal.throwIfAborted();
    while (true) {
      const { done, value } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_STREAM_BYTES)
        throw new Error("The service response exceeded the 1 MiB safety limit.");
      text += decoder.decode(value, { stream: true });
      if (now() - lastPublished >= PUBLISH_INTERVAL_MS) {
        publish(text, bytes);
        lastPublished = now();
      }
    }
    text += decoder.decode();
    publish(text, bytes);
  } finally {
    signal.removeEventListener("abort", abort);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
