import { vi, describe, it, expect } from "vitest";
import { Time } from "./time";
vi.useFakeTimers().setSystemTime("10/10/2020");
describe("time", () => {
  it("should get the difference in minutes between two dates", () => {
    const first = new Date("2020-10-09T23:00:00.000Z");
    const second = new Date("2020-10-09T23:02:00.000Z");
    const diff = Time.diff.minutes(first, second);
    expect(diff).toBe(2);
  });
  it("should get the difference in seconds between two dates", () => {
    const first = new Date("2020-10-09T23:00:00.000Z");
    const second = new Date("2020-10-09T23:00:02.000Z");
    const diff = Time.diff.seconds(first, second);
    expect(diff).toBe(2);
  });
  it("should get the difference in milliseconds between two dates", () => {
    const first = new Date("2020-10-09T23:00:00.000Z");
    const second = new Date("2020-10-09T23:00:00.002Z");
    const diff = Time.diff.millis(first, second);
    expect(diff).toBe(2);
  });
  it("should get the difference in days between two dates", () => {
    const first = new Date("2020-10-09T23:00:00.000Z");
    const second = new Date("2020-10-10T23:00:00.000Z");
    const diff = Time.diff.days(first, second);
    expect(diff).toBe(1);
  });
  it("should get the difference in hours between two dates", () => {
    const first = new Date("2020-10-09T23:00:00.000Z");
    const second = new Date("2020-10-10T01:00:00.000Z");
    const diff = Time.diff.hours(first, second);
    expect(diff).toBe(2);
  });
  it("should get the difference in weeks between two dates", () => {
    const first = new Date("2020-10-09T23:00:00.000Z");
    const second = new Date("2020-10-16T23:00:00.000Z");
    const diff = Time.diff.weeks(first, second);
    expect(diff).toBe(1);
  });
});
