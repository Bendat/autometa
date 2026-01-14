import { describe, expect, it } from "vitest";
import { Time, TimeDiff } from "../time/time.js";

describe("TimeDiff", () => {
  it("computes differences across units", () => {
    const start = new Date("2024-06-01T12:00:00.000Z");
    const end = new Date("2024-06-01T12:03:30.000Z");

    const diff = new TimeDiff();
    expect(diff.seconds(start, end)).toBe(210);
    expect(diff.minutes(start, end)).toBe(3.5);
    expect(diff.hours(start, end)).toBeCloseTo(0.058333333, 6);
    expect(diff.days(start, end)).toBeCloseTo(0.002430556, 6);
    expect(diff.weeks(start, end)).toBeCloseTo(0.000347222, 6);
  });

  it("looks up methods from phrases", () => {
    const start = new Date("2024-06-01T12:00:00.000Z");
    const end = new Date("2024-06-01T14:00:00.000Z");

    const diffFn = Time.diff.fromPhrase("hours");
    expect(diffFn(start, end)).toBe(2);
  });

  it("rejects unknown phrases", () => {
    expect(() => Time.diff.fromPhrase("centuries")).toThrow(/Unsupported diff unit/);
    expect(() => Time.diff.fromPhrase(3 as unknown as string)).toThrow(/expects a string/);
  });
});
