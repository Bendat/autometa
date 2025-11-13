import type { ExecutorConfig, TimeoutSetting } from "@autometa/config";
import type { TimeoutSpec, TimeoutUnit } from "@autometa/scopes";

const UNIT_TO_MILLISECONDS: Record<TimeoutUnit, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
};

type TimeoutInput = TimeoutSpec | TimeoutSetting | undefined;

export type TimeoutSource = "scenario" | "hook" | "config" | "default";

export interface TimeoutResolution {
  milliseconds: number | undefined;
  source: TimeoutSource;
}

const normalizeSpec = (spec: TimeoutInput): number | undefined => {
  if (spec === undefined || spec === null) {
    return undefined;
  }

  if (typeof spec === "number") {
    return spec <= 0 ? undefined : spec;
  }

  if (Array.isArray(spec)) {
    const [value, unit] = spec;
    if (typeof value !== "number" || value <= 0) {
      return undefined;
    }
    const multiplier = UNIT_TO_MILLISECONDS[unit as TimeoutUnit] ?? 1;
    return value * multiplier;
  }

  if (typeof spec !== "object") {
    return undefined;
  }

  const value = "duration" in spec ? spec.duration : (spec as { value?: number }).value;
  if (typeof value !== "number" || value <= 0) {
    return undefined;
  }
  const unit = "duration" in spec ? spec.unit : (spec as { unit?: TimeoutUnit }).unit;
  if (!unit) {
    return value;
  }
  const multiplier = UNIT_TO_MILLISECONDS[unit as TimeoutUnit] ?? 1;
  return value * multiplier;
};

export const resolveTimeout = (
  explicit: TimeoutSpec | undefined,
  config: ExecutorConfig,
  explicitSource: TimeoutSource = "scenario"
): TimeoutResolution => {
  const explicitMs = normalizeSpec(explicit);
  if (explicitMs !== undefined) {
    return { milliseconds: explicitMs, source: explicitSource };
  }

  const configMs = normalizeSpec(config.test?.timeout as TimeoutSetting | undefined);
  if (configMs !== undefined) {
    return { milliseconds: configMs, source: "config" };
  }

  return { milliseconds: undefined, source: "default" };
};

export const chooseTimeout = (
  primary: TimeoutSpec | undefined,
  secondary: TimeoutSpec | undefined,
  config: ExecutorConfig
): TimeoutResolution => {
  const secondaryResolution = resolveTimeout(secondary, config, "hook");
  if (secondaryResolution.milliseconds !== undefined) {
    return secondaryResolution;
  }

  return resolveTimeout(primary, config, "scenario");
};
