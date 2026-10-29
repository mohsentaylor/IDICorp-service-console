import { describe, expect, it } from "vitest";
import type { IncomingMessage } from "node:http";
import { ECHO_PROTOCOL, echoProtocols, sameOriginSocketUrl } from "@/lib/realtime/echoProtocol";
import { applyEchoAuth, decodeEchoEnvelope, EchoAuthError } from "@/lib/gateway/echoAuth";

const token = "eyJhbGciOiJIUzI1NiJ9.payload.sig-_+/=";

describe("echo authentication envelope", () => {
  it("round-trips the token from browser encoding to server decoding", () => {
    const header = echoProtocols(token).join(", ");
    expect(decodeEchoEnvelope(header)).toBe(token);
  });

  it("ignores clients that do not use the envelope", () => {
    expect(decodeEchoEnvelope(undefined)).toBeNull();
    expect(decodeEchoEnvelope("chat")).toBeNull();
  });

  it.each([
    ECHO_PROTOCOL,
    `${ECHO_PROTOCOL}, idicorp.token.`,
    `${ECHO_PROTOCOL}, idicorp.token.a+b`,
    `${ECHO_PROTOCOL}, idicorp.token.${Buffer.from("a\r\nX: 1").toString("base64url")}`,
    `${ECHO_PROTOCOL}, x, idicorp.token.YWJj`,
  ])("rejects malformed envelope %s", (header) => {
    expect(() => decodeEchoEnvelope(header)).toThrow(EchoAuthError);
  });

  it("rewrites the upgrade request: Bearer header in, credential protocol out", () => {
    const req = { headers: { "sec-websocket-protocol": echoProtocols(token).join(", ") } } as unknown as IncomingMessage;
    expect(applyEchoAuth(req)).toBe(ECHO_PROTOCOL);
    expect(req.headers.authorization).toBe(`Bearer ${token}`);
    expect(req.headers["sec-websocket-protocol"]).toBeUndefined();
  });

  it("refuses to encode an invalid token", () => {
    expect(() => echoProtocols("bad token")).toThrow();
  });

  it("builds same-origin socket URLs for http and https pages", () => {
    expect(sameOriginSocketUrl("/ws/echo", { protocol: "http:", host: "localhost:3000" })).toBe("ws://localhost:3000/ws/echo");
    expect(sameOriginSocketUrl("/ws/echo", { protocol: "https:", host: "a.com" })).toBe("wss://a.com/ws/echo");
  });
});
