import { describe, expect, it } from "vitest";
import { readSettings } from "@/lib/config/settings";

describe("readSettings", () => {
  it("defaults to the production backend and derives wss endpoints", () => {
    const s = readSettings({});
    expect(s.httpTarget).toBe("https://ts.idicorp.ir");
    expect(s.sockets.calculator.upstream).toBe("wss://ts.idicorp.ir/ws/calculator");
    expect(s.sockets.echo.upstream).toBe("wss://ts.idicorp.ir/ws/echo");
  });

  it("derives ws:// for an http backend and honours explicit socket URLs", () => {
    const s = readSettings({ API_BASE_URL: "http://127.0.0.1:4500", ECHO_WS_URL: "ws://other:9/echo" });
    expect(s.sockets.calculator.upstream).toBe("ws://127.0.0.1:4500/ws/calculator");
    expect(s.sockets.echo.upstream).toBe("ws://other:9/echo");
  });

  it.each(["https://user:pw@a.com", "https://a.com/api", "ftp://a.com", "https://a.com?x=1"])(
    "rejects API_BASE_URL=%s",
    (API_BASE_URL) => expect(() => readSettings({ API_BASE_URL })).toThrow(),
  );

  it("rejects socket URLs with a query or wrong scheme", () => {
    expect(() => readSettings({ CALCULATOR_WS_URL: "wss://a.com/ws?token=1" })).toThrow();
    expect(() => readSettings({ ECHO_WS_URL: "https://a.com/ws" })).toThrow();
  });
});
