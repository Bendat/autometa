import pc from "picocolors";

import type { GherkinStepSummary } from "@autometa/errors";

import { formatSourceLocation } from "./location";

export function describeStepSummary(step: GherkinStepSummary): {
  description: string;
  location?: string;
} {
  const keyword = step.keyword?.trim();
  const text = step.text?.trim();
  const descriptionParts = [keyword, text].filter((value): value is string => Boolean(value && value.length));
  const description = descriptionParts.length ? descriptionParts.join(" ") : "Step";
  const location = step.location
    ? pc.dim(` (${formatSourceLocation(step.location)})`)
    : undefined;

  return {
    description,
    ...(location ? { location } : {}),
  };
}
