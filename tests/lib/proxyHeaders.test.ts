import { describe, expect, it } from "vitest";
import {
  forwardRequestHeaders,
  forwardResponseHeaders,
  isSameOrigin,
  isSecureContext,
  rewriteSetCookie,
} from "@/lib/gateway/proxyHeaders";

describe("rewriteSetCookie", () => {
  const cookie = "session=abc; Domain=ts.idicorp.ir; Path=/api; HttpOnly; Secure; SameSite=None";

  it("binds the cookie to the console origin in a secure context", () => {
    expect(rewriteSetCookie(cookie, true)).toBe("session=abc; Path=/; HttpOnly; Secure; SameSite=None");
  });

  it("keeps cookies usable over plain HTTP on another device", () => {
    expect(rewriteSetCookie(cookie, false)).toBe("session=abc; Path=/; HttpOnly; SameSite=Lax");
  });
});

describe("isSecureContext", () => {
  it("treats https and localhost as secure, LAN http as insecure", () => {
    expect(isSecureContext(new URL("https://a.com/x"), null)).toBe(true);
    expect(isSecureContext(new URL("http://localhost:3000/x"), null)).toBe(true);
    expect(isSecureContext(new URL("http://192.168.1.5:3000/x"), null)).toBe(false);
    expect(isSecureContext(new URL("http://192.168.1.5:3000/x"), "https")).toBe(true);
  });
});

describe("header forwarding", () => {
  it("drops hop-by-hop request headers but keeps auth and cookies", () => {
    const out = forwardRequestHeaders(
      new Headers({ host: "x", connection: "keep-alive", authorization: "Bearer t", cookie: "a=1" }),
    );
    expect(out.get("host")).toBeNull();
    expect(out.get("connection")).toBeNull();
    expect(out.get("authorization")).toBe("Bearer t");
    expect(out.get("cookie")).toBe("a=1");
  });

  it("drops encoding/cookie headers from responses and disables caching", () => {
    const out = forwardResponseHeaders(
      new Headers({ "content-encoding": "gzip", "content-type": "text/plain", "set-cookie": "a=1" }),
    );
    expect(out.get("content-encoding")).toBeNull();
    expect(out.get("set-cookie")).toBeNull();
    expect(out.get("content-type")).toBe("text/plain");
    expect(out.get("cache-control")).toBe("no-store");
  });
});

describe("isSameOrigin", () => {
  it("allows missing or matching Origin and rejects others", () => {
    expect(isSameOrigin(null, "localhost:3000")).toBe(true);
    expect(isSameOrigin("http://localhost:3000", "localhost:3000")).toBe(true);
    expect(isSameOrigin("http://evil.com", "localhost:3000")).toBe(false);
    expect(isSameOrigin("not a url", "localhost:3000")).toBe(false);
  });
});
