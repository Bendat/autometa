import { AutomationError } from "@autometa/errors";
import { assertKey } from "@autometa/asserters";
import { normalizeToken } from "../shared/phrases.js";

export type TimeDiffFn = (start: Date, end: Date) => number;

const SUPPORTED_METHODS = [
  "minutes",
  "seconds",
  "millis",
  "days",
  "hours",
  "weeks",
] as const;
type MethodName = (typeof SUPPORTED_METHODS)[number];

function toTime(date: Date): number {
  return new Date(date).getTime();
}

export class TimeDiff {
  minutes(start: Date, end: Date): number {
    return this.millis(start, end) / 60_000;
  }

  seconds(start: Date, end: Date): number {
    return this.millis(start, end) / 1_000;
  }

  millis(start: Date, end: Date): number {
    const distance = Math.abs(toTime(end) - toTime(start));
    return Math.round(distance);
  }

  days(start: Date, end: Date): number {
    return this.millis(start, end) / 86_400_000;
  }

  hours(start: Date, end: Date): number {
    return this.millis(start, end) / 3_600_000;
  }

  weeks(start: Date, end: Date): number {
    return this.millis(start, end) / 604_800_000;
  }

  fromPhrase(phrase: unknown): TimeDiffFn {
    if (typeof phrase !== "string") {
      throw new AutomationError(
        `TimeDiff.fromPhrase expects a string, received '${typeof phrase}'.`
      );
    }

  const key = normalizeToken(phrase);
    if (!this.hasMethod(key)) {
      throw new AutomationError(
        `Unsupported diff unit '${phrase}'. Expected one of ${this.supportedMethods().join(", ")}.`
      );
    }

  assertKey(this, key as MethodName, "TimeDiff.fromPhrase");
  const method = this[key as MethodName];
    if (typeof method !== "function") {
      throw new AutomationError(`Diff method '${key}' is not callable.`);
    }
    return (method as TimeDiffFn).bind(this);
  }

  private hasMethod(name: string): boolean {
    return SUPPORTED_METHODS.includes(name as MethodName);
  }

  private supportedMethods(): MethodName[] {
    return [...SUPPORTED_METHODS];
  }
}
