import { describe, expect, it, vi } from "vitest";
import { MAX_STREAM_BYTES, readUtf8Stream } from "@/lib/stream/readUtf8Stream";

const streamOf = (chunks: Uint8Array[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((c) => controller.enqueue(c));
      controller.close();
    },
  });

describe("readUtf8Stream", () => {
  it("decodes multibyte characters split across chunks", async () => {
    const bytes = new TextEncoder().encode("سلام 👋");
    const chunks = [bytes.slice(0, 1), bytes.slice(1, 7), bytes.slice(7)];
    const publish = vi.fn();
    await readUtf8Stream(streamOf(chunks), new AbortController().signal, publish);
    expect(publish).toHaveBeenLastCalledWith("سلام 👋", bytes.length);
  });

  it("throttles intermediate updates but always publishes the final text", async () => {
    const clock = 0;
    const publish = vi.fn();
    const chunks = Array.from({ length: 10 }, () => new TextEncoder().encode("a"));
    await readUtf8Stream(streamOf(chunks), new AbortController().signal, publish, () => clock);
    // Clock never advances: one early publish + the final flush.
    expect(publish).toHaveBeenCalledTimes(2);
    expect(publish).toHaveBeenLastCalledWith("a".repeat(10), 10);
  });

  it("rejects responses above the safety limit", async () => {
    const big = new Uint8Array(MAX_STREAM_BYTES + 1);
    await expect(readUtf8Stream(streamOf([big]), new AbortController().signal, vi.fn())).rejects.toThrow(/1 MiB/);
  });

  it("stops when the signal is aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(readUtf8Stream(streamOf([new Uint8Array(1)]), controller.signal, vi.fn())).rejects.toBeDefined();
  });
});
