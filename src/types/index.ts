/**
 * Central catalogue of the application's data structures.
 *
 * Every interface, type alias and class that describes data moving through the
 * console lives here, so the shape of the domain can be read in one place.
 * Other modules import from "@/types" instead of declaring their own shapes.
 */

/* ------------------------------------------------------------------------ */
/* Backend DTOs (shapes returned by / sent to the IDICorp API)              */
/* ------------------------------------------------------------------------ */

/** A task as returned by `GET /api/tasks` and the other task routes. */
export interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

/** Body accepted by `POST /api/tasks` and `PUT /api/tasks/{id}`. */
export interface TaskInput {
  title: string;
  description: string;
  completed: boolean;
}

/** Body accepted by `PATCH /api/tasks/{id}` (any subset of fields). */
export type TaskPatch = Partial<TaskInput>;

/** Completion filter offered in the task toolbar. */
export type TaskFilter = "all" | "active" | "completed";

/** Query used to list tasks. */
export interface TaskQuery {
  search: string;
  filter: TaskFilter;
}

/** CAPTCHA challenge returned by `GET /api/auth/login`. */
export interface Captcha {
  /** `data:image/...;base64,...` URL rendered as-is. */
  captcha: string;
  /** Opaque value that must be sent back unchanged on sign-in. */
  salt: string;
}

/** Body of `POST /api/auth/login`. */
export interface LoginRequest {
  username: string;
  password: string;
  salt: string;
  captcha_answer: string;
}

/** Validated part of the sign-in response. */
export interface LoginResponse {
  access_token: string;
}

/* ------------------------------------------------------------------------ */
/* Calculator WebSocket protocol                                            */
/* ------------------------------------------------------------------------ */

export type CalculatorOperation = "add" | "subtract" | "multiply" | "divide";

/** Frame sent to `/ws/calculator` after the connection is ready. */
export interface CalculatorRequest {
  operation: CalculatorOperation;
  numbers: number[];
}

/** Frame received from `/ws/calculator` in reply to a request. */
export type CalculatorReply = { result: number } | { error: string };

/** Outcome of parsing the user's free-text list of numbers. */
export type ParsedNumbers =
  | { ok: true; values: number[] }
  | { ok: false; error: string };

/* ------------------------------------------------------------------------ */
/* Realtime / UI state                                                      */
/* ------------------------------------------------------------------------ */

/** The two WebSocket tools exposed by the backend. */
export type Channel = "calculator" | "echo";

/** Human-readable connection states shown in the UI. */
export type SocketState =
  | "Connecting"
  | "Connected"
  | "Disconnected"
  | "Connection error"
  | "Connection timed out"
  | "Unauthorized";

/** One line of the echo conversation log. */
export interface EchoEntry {
  id: number;
  kind: "Sent" | "Received";
  text: string;
}

/** Status of the streaming echo tool. */
export type StreamStatus =
  | "Ready"
  | "Receiving"
  | "Complete"
  | "Cancelled"
  | "Timed out"
  | "Failed";

/** Screens available after sign-in. */
export type View = "tasks" | "calculator" | "echo" | "stream";

/** Authenticated user held in memory only (never persisted). */
export interface Session {
  token: string;
  username: string;
}

/* ------------------------------------------------------------------------ */
/* Configuration                                                            */
/* ------------------------------------------------------------------------ */

/** Public endpoint information for one WebSocket tool. */
export interface SocketEndpoint {
  /** Same-origin path the browser connects to. */
  path: string;
  /** Real backend URL the gateway forwards to (displayed for transparency). */
  upstream: string;
}

/** Configuration that is safe to send to the browser. */
export interface ClientConfig {
  release: string;
  httpOrigin: string;
  sockets: Record<Channel, SocketEndpoint>;
}

/** Full server-side configuration derived from environment variables. */
export interface ServerSettings {
  httpTarget: string;
  sockets: Record<Channel, SocketEndpoint>;
  client: ClientConfig;
}

/* ------------------------------------------------------------------------ */
/* Errors                                                                   */
/* ------------------------------------------------------------------------ */

/**
 * Error raised for any failed HTTP call to the service.
 * `status` is the HTTP status, or 0 when no response was received.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 0,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Raised when the service answers with data that does not match its contract. */
export class InvalidResponseError extends Error {
  constructor() {
    super("The service returned an invalid response. Please retry.");
    this.name = "InvalidResponseError";
  }
}
