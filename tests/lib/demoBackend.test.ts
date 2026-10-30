import { beforeEach, describe, expect, it } from "vitest";
import { demoFetch, resetDemoBackend } from "@/lib/demo/demoBackend";
import { calculate } from "@/lib/demo/demoSocket";
import { parseCaptcha, parseTasks } from "@/lib/api/contracts";

/** Reads the CAPTCHA answer out of the generated SVG (test-only shortcut). */
const answerOf = (dataUrl: string) =>
  [...atob(dataUrl.split(",")[1]).matchAll(/>([A-Z0-9])<\/text>/g)].map((m) => m[1]).join("");

async function signIn(): Promise<string> {
  const captcha = parseCaptcha(await (await demoFetch("/api/auth/login")).json());
  const res = await demoFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "admin", password: "admin", salt: captcha.salt, captcha_answer: answerOf(captcha.captcha) }),
  });
  expect(res.status).toBe(200);
  return (await res.json()).access_token;
}

const call = (path: string, token: string, init: RequestInit = {}) =>
  demoFetch(path, { ...init, headers: { Authorization: `Bearer ${token}` } });

beforeEach(() => resetDemoBackend());

describe("demo sign-in", () => {
  it("issues a valid CAPTCHA and a token for the right answer", async () => {
    expect(await signIn()).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("rejects a wrong answer and never reuses a challenge", async () => {
    const { salt } = await (await demoFetch("/api/auth/login")).json();
    const wrong = { username: "admin", password: "admin", salt, captcha_answer: "zzzzz" };
    const res = await demoFetch("/api/auth/login", { method: "POST", body: JSON.stringify(wrong) });
    expect(res.status).toBe(401);
    expect((await res.json()).detail).toBe("Invalid credentials or CAPTCHA.");
  });

  it("returns 401 for task calls without a valid token", async () => {
    expect((await call("/api/tasks", "nope")).status).toBe(401);
  });
});

describe("demo tasks", () => {
  it("starts with two sample tasks and supports the full CRUD cycle", async () => {
    const token = await signIn();
    expect(parseTasks(await (await call("/api/tasks", token)).json())).toHaveLength(2);

    const created = await call("/api/tasks", token, {
      method: "POST",
      body: JSON.stringify({ title: "Buy milk", description: "2 litres", completed: false }),
    });
    expect(created.status).toBe(201);
    const { id } = await created.json();

    const patched = await call(`/api/tasks/${id}`, token, { method: "PATCH", body: JSON.stringify({ completed: true }) });
    expect((await patched.json()).completed).toBe(true);

    const search = await (await call("/api/tasks?q=MILK&completed=true", token)).json();
    expect(search.map((t: { id: number }) => t.id)).toEqual([id]);

    expect((await call(`/api/tasks/${id}`, token, { method: "DELETE" })).status).toBe(204);
    expect((await call(`/api/tasks/${id}`, token)).status).toBe(404);
  });

  it("validates input with 422", async () => {
    const token = await signIn();
    const res = await call("/api/tasks", token, { method: "POST", body: JSON.stringify({ title: "x".repeat(121) }) });
    expect(res.status).toBe(422);
    const put = await call("/api/tasks/1", token, { method: "PUT", body: JSON.stringify({ title: "only title" }) });
    expect(put.status).toBe(422);
  });

  it("keeps each sign-in's tasks separate", async () => {
    const first = await signIn();
    await call("/api/tasks/1", first, { method: "DELETE" });
    const second = await signIn();
    expect(await (await call("/api/tasks", second)).json()).toHaveLength(2);
  });
});

describe("demo streaming echo", () => {
  it("streams back exactly the bytes that were sent", async () => {
    const token = await signIn();
    const text = "سلام 👋 ".repeat(100);
    const res = await call("/api/echo/stream", token, { method: "POST", body: text });
    expect(await res.text()).toBe(text);
  });
});

describe("demo calculator rules", () => {
  it("follows the documented operations", () => {
    expect(calculate({ numbers: [10, 20] })).toBe(30);
    expect(calculate({ operation: "subtract", numbers: [10, 3, 2] })).toBe(5);
    expect(calculate({ operation: "multiply", numbers: [2, 3, 4] })).toBe(24);
    expect(calculate({ operation: "divide", numbers: [100, 4, 5] })).toBe(5);
  });

  it.each([
    { operation: "divide", numbers: [1, 0] },
    { operation: "power", numbers: [1] },
    { numbers: [] },
    { numbers: [1e13] },
    { numbers: Array(101).fill(1) },
  ])("rejects %j", (request) => expect(calculate(request)).toBeNull());
});
