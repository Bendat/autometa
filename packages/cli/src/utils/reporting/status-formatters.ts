import pc from "picocolors";

import type { ScenarioStatus } from "../../runtime/types";
import type { GherkinStepSummary } from "@autometa/errors";

export function getScenarioStatusIcon(status: ScenarioStatus): string {
  switch (status) {
    case "passed":
      return pc.green("✓");
    case "failed":
      return pc.red("✗");
    case "skipped":
      return pc.yellow("○");
    case "pending":
      return pc.cyan("◌");
    default:
      return pc.dim("?");
  }
}

export function colorizeScenarioStatus(text: string, status: ScenarioStatus): string {
  switch (status) {
    case "passed":
      return pc.green(text);
    case "failed":
      return pc.red(text);
    case "skipped":
      return pc.yellow(text);
    case "pending":
      return pc.cyan(text);
    default:
      return text;
  }
}

export function getStepStatusIcon(status: GherkinStepSummary["status"]): string {
  switch (status) {
    case "passed":
      return pc.green("✓");
    case "failed":
      return pc.red("✗");
    case "skipped":
    default:
      return pc.yellow("○");
  }
}

export function colorizeStepDescription(
  description: string,
  status: GherkinStepSummary["status"]
): string {
  switch (status) {
    case "passed":
      return pc.green(description);
    case "failed":
      return pc.red(description);
    case "skipped":
      return pc.yellow(description);
    default:
      return description;
  }
}
