/**
 * In-browser stand-in for the IDICorp backend, used only by the static
 * (GitHub Pages) build, which has no server and cannot reach the real API.
 *
 * It follows the documented contract so every screen behaves as it would
 * against the real service: CAPTCHA + salt sign-in, session-scoped tasks that
 * expire one hour after their last change, 401/404/422 errors, and a streamed
 * echo. Data lives in memory, so a page reload starts a fresh session, exactly
 * like the real app (the token is never persisted).
 */
import type { Task } from "@/types";

export const DEMO_USERNAME = "admin";
export const DEMO_PASSWORD = "admin";
export const TASK_TTL_MS = 60 * 60 * 1000;
const LATENCY_MS = 120;
/** No 0/O or 1/I/l so the CAPTCHA is readable. */
const CAPTCHA_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

interface DemoSession {
  tasks: Map<number, Task>;
  nextId: number;
}

const challenges = new Map<string, string>(); // salt -> answer
const sessions = new Map<string, DemoSession>(); // token -> session

const randomString = (length: number, alphabet: string) => {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
};

const delay = (ms: number, signal?: AbortSignal | null) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
    });
  });

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Draws the CAPTCHA as an SVG image with light noise. */
export function captchaImage(answer: string): string {
  const letters = [...answer]
    .map((ch, i) => {
      const x = 18 + i * 26;
      const rotate = ((i * 37) % 30) - 15;
      return `<text x="${x}" y="38" font-size="28" font-family="monospace" font-weight="700" fill="#234938" transform="rotate(${rotate} ${x} 30)">${ch}</text>`;
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="52"><rect width="160" height="52" fill="#e7ecdf"/><path d="M4 30 Q40 6 80 28 T156 22" stroke="#9bad76" stroke-width="2" fill="none"/>${letters}<path d="M6 16 L154 40" stroke="#c39728" stroke-width="1"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function newSession(): DemoSession {
  const now = new Date().toISOString();
  const seed: Omit<Task, "id">[] = [
    { title: "Explore your workspace", description: "Try search, filters, and the real-time service tools.", completed: false, created_at: now, updated_at: now },
    { title: "Connect to the service", description: "Your session is ready. Make something happen.", completed: true, created_at: now, updated_at: now },
  ];
  const tasks = new Map<number, Task>();
  seed.forEach((t, i) => tasks.set(i + 1, { id: i + 1, ...t }));
  return { tasks, nextId: seed.length + 1 };
}

/** Drops tasks whose one-hour lifetime has passed. */
function liveTasks(session: DemoSession): Task[] {
  const now = Date.now();
  for (const [id, task] of session.tasks)
    if (now - Date.parse(task.updated_at) > TASK_TTL_MS) session.tasks.delete(id);
  return [...session.tasks.values()];
}

/** FastAPI-style 422 body. */
const invalid = (msg: string) => json(422, { detail: [{ msg }] });

function validateTask(body: Record<string, unknown>, partial: boolean): string | null {
  const has = (key: string) => body[key] !== undefined;
  if (!partial || has("title")) {
    if (typeof body.title !== "string" || !body.title.trim()) return "Title is required.";
    if (body.title.length > 120) return "Title must be at most 120 characters.";
  }
  if (has("description") && (typeof body.description !== "string" || body.description.length > 2000))
    return "Description must be at most 2,000 characters.";
  if (has("completed") && typeof body.completed !== "boolean") return "Completed must be true or false.";
  if (!partial && (!has("description") || !has("completed"))) return "Title, description and completed are required.";
  return null;
}

/** Returns the session for a Bearer header, or null (→ 401). */
export function sessionFor(authorization: string | null): DemoSession | null {
  const token = authorization?.replace(/^Bearer /, "") ?? "";
  return sessions.get(token) ?? null;
}

/** Valid token check shared with the demo sockets. */
export const isDemoToken = (token: unknown) => typeof token === "string" && sessions.has(token);

async function readJson(init: RequestInit): Promise<Record<string, unknown> | null> {
  try {
    const value = JSON.parse(String(init.body ?? ""));
    return typeof value === "object" && value && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

/** Splits the echoed bytes into small chunks so the UI shows real streaming. */
function streamBack(bytes: Uint8Array, signal?: AbortSignal | null): ReadableStream<Uint8Array> {
  let offset = 0;
  return new ReadableStream({
    async pull(controller) {
      if (offset >= bytes.length) return controller.close();
      await delay(20, signal).catch(() => undefined);
      controller.enqueue(bytes.slice(offset, offset + 256));
      offset += 256;
    },
  });
}

/** `fetch` replacement: answers `/api/*` calls in the browser. */
export async function demoFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const url = new URL(input, "https://demo.invalid");
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  await delay(LATENCY_MS, init.signal);

  if (url.pathname === "/api/auth/login") {
    if (method === "GET") {
      const salt = randomString(10, "abcdefghijklmnopqrstuvwxyz0123456789");
      const answer = randomString(5, CAPTCHA_ALPHABET);
      challenges.set(salt, answer);
      return json(200, { captcha: captchaImage(answer), salt });
    }
    const body = await readJson(init);
    const expected = typeof body?.salt === "string" ? challenges.get(body.salt) : undefined;
    if (typeof body?.salt === "string") challenges.delete(body.salt); // single-use
    if (
      !expected ||
      String(body?.captcha_answer ?? "").trim().toUpperCase() !== expected ||
      body?.username !== DEMO_USERNAME ||
      body?.password !== DEMO_PASSWORD
    )
      return json(401, { detail: "Invalid credentials or CAPTCHA." });
    const token = crypto.randomUUID();
    sessions.set(token, newSession());
    return json(200, { access_token: token, token_type: "bearer" });
  }

  const session = sessionFor(headers.get("Authorization"));
  if (!session) return json(401, { detail: "Unauthorized" });

  if (url.pathname === "/api/echo/stream" && method === "POST") {
    const bytes =
      init.body instanceof Uint8Array ? init.body : new TextEncoder().encode(String(init.body ?? ""));
    return new Response(streamBack(bytes, init.signal), {
      status: 200,
      headers: { "Content-Type": headers.get("Content-Type") ?? "application/octet-stream" },
    });
  }

  if (url.pathname === "/api/tasks") {
    if (method === "GET") {
      const q = url.searchParams.get("q")?.toLowerCase() ?? "";
      const completed = url.searchParams.get("completed");
      const list = liveTasks(session).filter(
        (t) =>
          (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) &&
          (completed === null || String(t.completed) === completed),
      );
      return json(200, list);
    }
    if (method === "POST") {
      const body = (await readJson(init)) ?? {};
      const error = validateTask(body, true) ?? (body.title === undefined ? "Title is required." : null);
      if (error) return invalid(error);
      const now = new Date().toISOString();
      const task: Task = {
        id: session.nextId++,
        title: String(body.title).trim(),
        description: typeof body.description === "string" ? body.description : "",
        completed: body.completed === true,
        created_at: now,
        updated_at: now,
      };
      session.tasks.set(task.id, task);
      return json(201, task);
    }
  }

  const match = url.pathname.match(/^\/api\/tasks\/(\d+)$/);
  if (match) {
    liveTasks(session);
    const task = session.tasks.get(Number(match[1]));
    if (!task) return json(404, { detail: "Task not found" });
    if (method === "GET") return json(200, task);
    if (method === "DELETE") {
      session.tasks.delete(task.id);
      return json(204);
    }
    if (method === "PUT" || method === "PATCH") {
      const body = (await readJson(init)) ?? {};
      const error = validateTask(body, method === "PATCH");
      if (error) return invalid(error);
      const updated: Task = {
        ...task,
        ...(body.title !== undefined && { title: String(body.title).trim() }),
        ...(body.description !== undefined && { description: String(body.description) }),
        ...(body.completed !== undefined && { completed: body.completed === true }),
        updated_at: new Date().toISOString(),
      };
      session.tasks.set(task.id, updated);
      return json(200, updated);
    }
  }
  return json(404, { detail: "Not found" });
}

/** Test helper: forget every challenge and session. */
export function resetDemoBackend() {
  challenges.clear();
  sessions.clear();
}
