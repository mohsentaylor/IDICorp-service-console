import { describe, expect, it } from "vitest";
import { parseNumbers } from "@/lib/calculator/parseNumbers";

describe("parseNumbers", () => {
  it("accepts commas, spaces and newlines", () => {
    expect(parseNumbers("10, 20 30\n-4.5", "add")).toEqual({ ok: true, values: [10, 20, 30, -4.5] });
  });

  it.each(["", "  ", "1, two", "abc", "1e13", "Infinity", Array(101).fill(1).join(",")])("rejects %j", (input) => {
    expect(parseNumbers(input, "add").ok).toBe(false);
  });

  it("rejects division by zero only after the first number", () => {
    expect(parseNumbers("10 0", "divide")).toEqual({ ok: false, error: "Division by zero is not allowed." });
    expect(parseNumbers("0 10", "divide").ok).toBe(true);
    expect(parseNumbers("10 0", "multiply").ok).toBe(true);
  });
});
