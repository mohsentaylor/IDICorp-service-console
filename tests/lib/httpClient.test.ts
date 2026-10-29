import { afterEach, describe, expect, it, vi } from "vitest";
import { errorMessage, extractDetail, isUncertainFailure, request } from "@/lib/api/httpClient";
import { SESSION_EXPIRED } from "@/lib/session/sessionEvents";
import { ApiError } from "@/types";

const respond = (status: number, body?: unknown) =>
  vi.fn().mockResolvedValue(new Response(body === undefined ? null : JSON.stringify(body), { status }));

afterEach(() => vi.unstubAllGlobals());

describe("request", () => {
  it("sends the bearer token with credentials and decodes the body", async () => {
    const fetchMock = respond(200, { ok: 1 });
    vi.stubGlobal("fetch", fetchMock);
    const decode = vi.fn((v: unknown) => v);
    await expect(request("/api/x", { token: "t1", decode })).resolves.toEqual({ ok: 1 });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.credentials).toBe("include");
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer t1");
    expect(decode).toHaveBeenCalled();
  });

  it("returns undefined for 204", async () => {
    vi.stubGlobal("fetch", respond(204));
    await expect(request("/api/x", { token: "t" })).resolves.toBeUndefined();
  });

  it("uses the backend detail message and status", async () => {
    vi.stubGlobal("fetch", respond(422, { detail: [{ msg: "title too long" }] }));
    await expect(request("/api/x", { token: "t" })).rejects.toEqual(new ApiError("title too long", 422));
  });

  it("signals session expiry on 401 for the failing token", async () => {
    vi.stubGlobal("fetch", respond(401, {}));
    const listener = vi.fn();
    window.addEventListener(SESSION_EXPIRED, listener);
    await expect(request("/api/x", { token: "old" })).rejects.toMatchObject({ status: 401 });
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toBe("old");
    window.removeEventListener(SESSION_EXPIRED, listener);
  });

  it("maps network failures to a status-0 ApiError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("failed")));
    const error = await request("/api/x").catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(isUncertainFailure(error)).toBe(true);
  });

  it("re-throws caller cancellation instead of reporting an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("aborted", "AbortError")));
    const controller = new AbortController();
    controller.abort("left the screen");
    await expect(request("/api/x", { signal: controller.signal })).rejects.toBe("left the screen");
  });
});

describe("helpers", () => {
  it("extractDetail handles all FastAPI shapes", () => {
    expect(extractDetail({ detail: "x" })).toBe("x");
    expect(extractDetail({ error: "y" })).toBe("y");
    expect(extractDetail({ detail: [{ msg: "a" }, { msg: "b" }] })).toBe("a; b");
    expect(extractDetail(null)).toBe("");
  });

  it("errorMessage falls back for non-errors", () => {
    expect(errorMessage(new Error("boom"))).toBe("boom");
    expect(errorMessage(42)).toMatch(/Something went wrong/);
  });
});
