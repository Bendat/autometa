import { describe, expect, it } from "vitest";
import { TestStatus, isTerminalStatus } from "../index.js";

describe("TestStatus", () => {
  it("marks terminal outcomes as terminal", () => {
    expect(isTerminalStatus(TestStatus.PASSED)).toBe(true);
    expect(isTerminalStatus(TestStatus.FAILED)).toBe(true);
    expect(isTerminalStatus(TestStatus.SKIPPED)).toBe(true);
    expect(isTerminalStatus(TestStatus.BROKEN)).toBe(true);
  });

  it("marks non-terminal outcomes as non-terminal", () => {
    expect(isTerminalStatus(TestStatus.IDLE)).toBe(false);
    expect(isTerminalStatus(TestStatus.RUNNING)).toBe(false);
  });
});
