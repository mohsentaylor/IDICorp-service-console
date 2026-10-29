import type { CalculatorOperation, ParsedNumbers } from "@/types";

/** Limits documented by the calculator WebSocket contract. */
export const MAX_NUMBERS = 100;
export const MAX_ABS_VALUE = 1e12;

export const OPERATIONS: { value: CalculatorOperation; label: string }[] = [
  { value: "add", label: "＋ Add" },
  { value: "subtract", label: "− Subtract" },
  { value: "multiply", label: "× Multiply" },
  { value: "divide", label: "÷ Divide" },
];

/**
 * Turns user input such as "10, 20 30" into numbers and validates it against
 * the backend contract, so obviously invalid requests never leave the browser.
 */
export function parseNumbers(input: string, operation: CalculatorOperation): ParsedNumbers {
  const trimmed = input.trim();
  const chunks = trimmed.split(/[\s,]+/);
  const values = chunks.map(Number);
  if (
    !trimmed ||
    chunks.some((chunk) => !chunk) ||
    values.length > MAX_NUMBERS ||
    values.some((v) => !Number.isFinite(v) || Math.abs(v) > MAX_ABS_VALUE)
  )
    return { ok: false, error: "Enter 1–100 finite numbers, each between -1e12 and 1e12." };
  if (operation === "divide" && values.slice(1).includes(0))
    return { ok: false, error: "Division by zero is not allowed." };
  return { ok: true, values };
}
