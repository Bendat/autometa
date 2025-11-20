import pc from "picocolors";

import type {
  RuntimeSummary,
  ScenarioStatus,
  SummaryContext,
} from "../runtime/types";

export interface FormattedReport {
  readonly status: ScenarioStatus;
  readonly fullName: string;
  readonly durationMs?: number;
  readonly error?: Error;
  readonly reason?: string;
}

export function formatScenarioReport(report: FormattedReport): string {
  const statusLabel = formatStatusLabel(report.status);
  const duration = report.durationMs !== undefined 
    ? formatDuration(report.durationMs) 
    : "";
  
  const nameWithDuration = duration 
    ? `${report.fullName} ${pc.dim(`(${duration})`)}`
    : report.fullName;
  
  return `${statusLabel} ${nameWithDuration}`;
}

export function formatStatusLabel(status: ScenarioStatus): string {
  switch (status) {
    case "passed":
      return pc.green("✓ PASS");
    case "failed":
      return pc.red("✗ FAIL");
    case "skipped":
      return pc.yellow("○ SKIP");
    case "pending":
      return pc.cyan("◌ PEND");
    default:
      return assertUnreachable(status);
  }
}

export function formatDuration(ms: number): string {
  if (ms < 1) {
    return `${ms.toFixed(2)} ms`;
  }
  if (ms < 1000) {
    return `${ms.toFixed(0)} ms`;
  }
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatError(error: Error): string {
  const stack = error.stack ?? error.message;
  // Indent each line and apply dim color to stack traces
  return stack
    .split("\n")
    .map((line, index) => {
      const indented = `    ${line}`;
      // First line (message) in red, stack traces in dim
      return index === 0 ? pc.red(indented) : pc.dim(indented);
    })
    .join("\n");
}

export function formatReason(reason: string): string {
  return pc.dim(`    Reason: ${reason}`);
}

export function formatSummary(
  summary: RuntimeSummary,
  context: SummaryContext
): string {
  const parts: string[] = [`Environment: ${pc.cyan(context.environment)}`];

  parts.push(`Total: ${pc.bold(String(summary.total))}`);

  if (summary.passed > 0) {
    parts.push(`Passed: ${pc.green(String(summary.passed))}`);
  }

  if (summary.failed > 0) {
    parts.push(`Failed: ${pc.red(String(summary.failed))}`);
  }

  if (summary.skipped > 0) {
    parts.push(`Skipped: ${pc.yellow(String(summary.skipped))}`);
  }

  if (summary.pending > 0) {
    parts.push(`Pending: ${pc.cyan(String(summary.pending))}`);
  }

  parts.push(`Duration: ${pc.dim(formatDuration(summary.durationMs))}`);

  return parts.join(" | ");
}

export function formatFeatureHeader(featureName: string): string {
  return `\n${pc.bold(pc.blue(`Feature: ${featureName}`))}`;
}

export function formatRuleHeader(ruleName: string, indent = 2): string {
  const spaces = " ".repeat(indent);
  return `${spaces}${pc.bold(pc.magenta(`Rule: ${ruleName}`))}`;
}

function assertUnreachable(value: never): never {
  throw new Error(`Unhandled scenario status: ${String(value)}`);
}
