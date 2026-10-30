/**
 * In-browser stand-in for the calculator and echo WebSockets (static build
 * only). It exposes the subset of the browser WebSocket API that useSocket
 * uses, and follows the backend protocol:
 *
 * - calculator: first frame `{"token": ...}` within one second → `ready`;
 *   then `{"operation","numbers"}` → `{"result"}` or
 *   `{"error":"Invalid calculator request"}` (connection stays open).
 * - echo: authenticated in the handshake (the token envelope) → `ready`;
 *   then every text frame is sent back unchanged.
 */
import { isDemoToken } from "./demoBackend";
import { TOKEN_PREFIX } from "@/lib/realtime/echoProtocol";

type Operation = "add" | "subtract" | "multiply" | "divide";

/** Calculator rules from the backend contract. Returns null if invalid. */
export function calculate(request: unknown): number | null {
  if (typeof request !== "object" || request === null) return null;
  const { operation = "add", numbers } = request as { operation?: unknown; numbers?: unknown };
  if (!["add", "subtract", "multiply", "divide"].includes(String(operation))) return null;
  if (
    !Array.isArray(numbers) ||
    numbers.length < 1 ||
    numbers.length > 100 ||
    numbers.some((n) => typeof n !== "number" || !Number.isFinite(n) || Math.abs(n) > 1e12)
  )
    return null;
  const values = numbers as number[];
  if (operation === "divide" && values.slice(1).includes(0)) return null;
  const [first, ...rest] = values;
  switch (operation as Operation) {
    case "add":
      return values.reduce((a, b) => a + b, 0);
    case "subtract":
      return rest.reduce((a, b) => a - b, first);
    case "multiply":
      return values.reduce((a, b) => a * b, 1);
    case "divide":
      return rest.reduce((a, b) => a / b, first);
  }
}

/** Decodes the echo handshake envelope offered as subprotocols. */
function tokenFromProtocols(protocols?: string | string[]): string | null {
  const list = Array.isArray(protocols) ? protocols : protocols ? [protocols] : [];
  const encoded = list.find((p) => p.startsWith(TOKEN_PREFIX))?.slice(TOKEN_PREFIX.length);
  if (!encoded) return null;
  try {
    return atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
  } catch {
    return null;
  }
}

export class DemoSocket {
  readyState: number = WebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  private authorized = false;
  private authTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly channel: "calculator" | "echo";

  constructor(url: string, protocols?: string | string[]) {
    this.channel = url.includes("echo") ? "echo" : "calculator";
    const handshakeToken = this.channel === "echo" ? tokenFromProtocols(protocols) : null;
    setTimeout(() => {
      if (this.readyState !== WebSocket.CONNECTING) return;
      // Echo refuses the handshake without a valid token (the backend's 403).
      if (this.channel === "echo" && !isDemoToken(handshakeToken)) {
        this.onerror?.(new Event("error"));
        return this.finish(1006);
      }
      this.readyState = WebSocket.OPEN;
      this.onopen?.(new Event("open"));
      if (this.channel === "echo") {
        this.authorized = true;
        this.emit({ type: "ready" });
      } else {
        this.authTimer = setTimeout(() => this.reject(), 1000);
      }
    }, 80);
  }

  send(data: string) {
    if (this.readyState !== WebSocket.OPEN) throw new DOMException("Socket is not open", "InvalidStateError");
    setTimeout(() => this.receive(String(data)), 30);
  }

  close() {
    if (this.readyState === WebSocket.CLOSED) return;
    this.finish(1000);
  }

  private receive(data: string) {
    if (this.readyState !== WebSocket.OPEN) return;
    if (this.channel === "echo") return this.emitRaw(data);
    let frame: unknown;
    try {
      frame = JSON.parse(data);
    } catch {
      return this.authorized ? this.emit({ error: "Invalid calculator request" }) : this.reject();
    }
    if (!this.authorized) {
      clearTimeout(this.authTimer);
      if (!isDemoToken((frame as { token?: unknown })?.token)) return this.reject();
      this.authorized = true;
      return this.emit({ type: "ready" });
    }
    const result = calculate(frame);
    this.emit(result === null ? { error: "Invalid calculator request" } : { result });
  }

  private reject() {
    this.emit({ error: "Unauthorized" });
    this.finish(1008);
  }

  private emit(value: unknown) {
    this.emitRaw(JSON.stringify(value));
  }

  private emitRaw(data: string) {
    this.onmessage?.(new MessageEvent("message", { data }));
  }

  private finish(code: number) {
    clearTimeout(this.authTimer);
    this.readyState = WebSocket.CLOSED;
    this.onclose?.(new CloseEvent("close", { code }));
  }
}
