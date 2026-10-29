import { describe, expect, it, vi } from "vitest";
import { expireSession, onSessionExpired } from "@/lib/session/sessionEvents";

describe("session events", () => {
  it("delivers the expired token and unsubscribes cleanly", () => {
    const listener = vi.fn();
    const off = onSessionExpired(listener);
    expireSession("t1");
    off();
    expireSession("t2");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith("t1");
  });
});
