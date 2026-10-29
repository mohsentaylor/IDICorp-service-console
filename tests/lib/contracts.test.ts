import { describe, expect, it } from "vitest";
import { isValidToken, parseCalculation, parseCaptcha, parseLogin, parseTasks } from "@/lib/api/contracts";
import { InvalidResponseError } from "@/types";

const task = {
  id: 1,
  title: "A",
  description: "",
  completed: false,
  created_at: "2026-10-28T10:00:00Z",
  updated_at: "2026-10-28T10:00:00Z",
};

describe("parseCaptcha", () => {
  it("accepts a base64 image data URL and keeps the salt unchanged", () => {
    const value = { captcha: "data:image/jpeg;base64,AAAA", salt: "s-1", extra: 1 };
    expect(parseCaptcha(value)).toEqual({ captcha: "data:image/jpeg;base64,AAAA", salt: "s-1" });
  });

  it.each([
    null,
    { captcha: "http://evil/x.png", salt: "s" },
    { captcha: "data:image/jpeg;base64,AAAA", salt: "" },
    { captcha: "data:text/html;base64,AAAA", salt: "s" },
  ])("rejects %j", (value) => {
    expect(() => parseCaptcha(value)).toThrow(InvalidResponseError);
  });
});

describe("parseLogin / isValidToken", () => {
  it("returns only the access token", () => {
    expect(parseLogin({ access_token: "abc.def-1", token_type: "bearer" })).toEqual({ access_token: "abc.def-1" });
  });

  it("rejects tokens that could inject headers", () => {
    expect(isValidToken("abc\r\nX-Evil: 1")).toBe(false);
    expect(isValidToken("")).toBe(false);
    expect(isValidToken("a".repeat(9000))).toBe(false);
    expect(() => parseLogin({ access_token: "bad token" })).toThrow(InvalidResponseError);
  });
});

describe("parseTasks", () => {
  it("returns clean task objects", () => {
    expect(parseTasks([{ ...task, junk: true }])).toEqual([task]);
  });

  it("rejects duplicated IDs, wrong types and bad dates", () => {
    expect(() => parseTasks([task, task])).toThrow(InvalidResponseError);
    expect(() => parseTasks([{ ...task, completed: "no" }])).toThrow(InvalidResponseError);
    expect(() => parseTasks([{ ...task, updated_at: "not a date" }])).toThrow(InvalidResponseError);
    expect(() => parseTasks({ items: [] })).toThrow(InvalidResponseError);
  });
});

describe("parseCalculation", () => {
  it("parses results and backend errors", () => {
    expect(parseCalculation('{"result":30}')).toEqual({ result: 30 });
    expect(parseCalculation('{"error":"Invalid calculator request"}')).toEqual({ error: "Invalid calculator request" });
  });

  it("rejects non-JSON and non-finite results", () => {
    expect(() => parseCalculation("hello")).toThrow(InvalidResponseError);
    expect(() => parseCalculation('{"result":"30"}')).toThrow(InvalidResponseError);
  });
});
