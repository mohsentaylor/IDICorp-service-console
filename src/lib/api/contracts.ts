/**
 * Runtime validation of data received from the network.
 * TypeScript types disappear at runtime, so every DTO is checked here before
 * the UI trusts it. Each parser either returns a clean object or throws
 * InvalidResponseError.
 */
import {
  InvalidResponseError,
  type Captcha,
  type CalculatorReply,
  type LoginResponse,
  type Task,
} from "@/types";

/** Characters allowed in a Bearer token (RFC 6750 b64token). */
export const TOKEN_PATTERN = /^[A-Za-z0-9._~+/-]+=*$/;
export const MAX_TOKEN_LENGTH = 8192;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isDate = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

function invalid(): never {
  throw new InvalidResponseError();
}

export function isValidToken(token: unknown): token is string {
  return (
    typeof token === "string" &&
    token.trim().length > 0 &&
    token.length <= MAX_TOKEN_LENGTH &&
    TOKEN_PATTERN.test(token)
  );
}

export function parseCaptcha(value: unknown): Captcha {
  if (
    !isRecord(value) ||
    typeof value.salt !== "string" ||
    !value.salt ||
    typeof value.captcha !== "string" ||
    !/^data:image\/(jpeg|png|svg\+xml);base64,[A-Za-z0-9+/=\s]+$/.test(value.captcha)
  )
    return invalid();
  return { captcha: value.captcha, salt: value.salt };
}

export function parseLogin(value: unknown): LoginResponse {
  if (!isRecord(value) || !isValidToken(value.access_token)) return invalid();
  return { access_token: value.access_token };
}

export function parseTask(value: unknown): Task {
  if (
    !isRecord(value) ||
    typeof value.id !== "number" ||
    !Number.isSafeInteger(value.id) ||
    typeof value.title !== "string" ||
    typeof value.description !== "string" ||
    typeof value.completed !== "boolean" ||
    !isDate(value.created_at) ||
    !isDate(value.updated_at)
  )
    return invalid();
  return {
    id: value.id,
    title: value.title,
    description: value.description,
    completed: value.completed,
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
}

/** Parses a task list and rejects duplicated IDs (they would break React keys). */
export function parseTasks(value: unknown): Task[] {
  if (!Array.isArray(value)) return invalid();
  const ids = new Set<number>();
  return value.map((item) => {
    const task = parseTask(item);
    if (ids.has(task.id)) return invalid();
    ids.add(task.id);
    return task;
  });
}

/** Parses one calculator reply frame (text) into a result or an error. */
export function parseCalculation(text: string): CalculatorReply {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return invalid();
  }
  if (!isRecord(value)) return invalid();
  if (typeof value.error === "string") return { error: value.error };
  if (typeof value.result === "number" && Number.isFinite(value.result))
    return { result: value.result };
  return invalid();
}
