import { AutomationError } from "@autometa/errors";

export type StandardTimeUnit =
  | "milliseconds"
  | "seconds"
  | "minutes"
  | "hours"
  | "days"
  | "weeks"
  | "months"
  | "years";

export interface NormalisedTimeUnit {
  unit: StandardTimeUnit;
  scale: number;
}

const UNIT_ALIASES: Record<string, NormalisedTimeUnit> = {
  millisecond: { unit: "milliseconds", scale: 1 },
  milliseconds: { unit: "milliseconds", scale: 1 },
  ms: { unit: "milliseconds", scale: 1 },
  second: { unit: "seconds", scale: 1 },
  seconds: { unit: "seconds", scale: 1 },
  sec: { unit: "seconds", scale: 1 },
  secs: { unit: "seconds", scale: 1 },
  minute: { unit: "minutes", scale: 1 },
  minutes: { unit: "minutes", scale: 1 },
  min: { unit: "minutes", scale: 1 },
  mins: { unit: "minutes", scale: 1 },
  hour: { unit: "hours", scale: 1 },
  hours: { unit: "hours", scale: 1 },
  hr: { unit: "hours", scale: 1 },
  hrs: { unit: "hours", scale: 1 },
  day: { unit: "days", scale: 1 },
  days: { unit: "days", scale: 1 },
  week: { unit: "weeks", scale: 1 },
  weeks: { unit: "weeks", scale: 1 },
  fortnight: { unit: "days", scale: 14 },
  fortnights: { unit: "days", scale: 14 },
  month: { unit: "months", scale: 1 },
  months: { unit: "months", scale: 1 },
  year: { unit: "years", scale: 1 },
  years: { unit: "years", scale: 1 },
};

export function resolveTimeUnit(input: string): NormalisedTimeUnit {
  const key = input.trim().toLowerCase();
  const resolved = UNIT_ALIASES[key];
  if (!resolved) {
    throw new AutomationError(
      `Unsupported time unit '${input}'. Expected one of ${Object.keys(UNIT_ALIASES)
        .sort()
        .join(", ")}.`
    );
  }
  return resolved;
}
