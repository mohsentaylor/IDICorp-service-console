import { describe, expect, it } from "vitest";
import { buildTaskSearchParams, estimateExpiry } from "@/lib/tasks/taskQuery";
import { safeNextPath } from "@/lib/navigation/views";

describe("buildTaskSearchParams", () => {
  it("maps search and filter to the backend query", () => {
    expect(buildTaskSearchParams({ search: "", filter: "all" }).toString()).toBe("");
    expect(buildTaskSearchParams({ search: "milk", filter: "active" }).toString()).toBe("q=milk&completed=false");
    expect(buildTaskSearchParams({ search: "", filter: "completed" }).toString()).toBe("completed=true");
  });
});

describe("estimateExpiry", () => {
  it("adds one hour to the last update", () => {
    expect(estimateExpiry("2026-10-28T10:00:00Z").toISOString()).toBe("2026-10-28T11:00:00.000Z");
  });
});

describe("safeNextPath", () => {
  it("only allows known workspace routes", () => {
    expect(safeNextPath("?next=%2Fcalculator")).toBe("/calculator");
    expect(safeNextPath("?next=%2Fcalculator%2F")).toBe("/calculator");
    expect(safeNextPath("?next=https%3A%2F%2Fevil.com")).toBe("/tasks");
    expect(safeNextPath("?next=%2F%2Fevil.com")).toBe("/tasks");
    expect(safeNextPath("")).toBe("/tasks");
  });
});
