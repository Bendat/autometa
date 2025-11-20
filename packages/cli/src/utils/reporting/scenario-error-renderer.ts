import pc from "picocolors";

import type { GherkinErrorContext } from "@autometa/errors";

import { GherkinContextPrinter } from "./gherkin-context-printer";
import { describeStepSummary } from "./step-summary";
import { colorizeStepDescription, getStepStatusIcon } from "./status-formatters";

type LogFn = (line: string) => void;

type BaselineOptions = {
  readonly context?: GherkinErrorContext;
  readonly depth: number;
  readonly messageLines: readonly string[];
  readonly formattedStack: readonly string[];
  readonly truncated: boolean;
};

type ScenarioOptions = BaselineOptions & {
  readonly context: GherkinErrorContext;
};

export class BaselineErrorRenderer {
  constructor(
    private readonly contextPrinter: GherkinContextPrinter,
    private readonly log: LogFn = console.log
  ) {}

  print(options: BaselineOptions): void {
    const {
      context,
      depth,
      messageLines,
      formattedStack,
      truncated,
    } = options;
    const indent = "  ".repeat(depth);

    if (messageLines.length > 0) {
      for (const line of messageLines) {
        const trimmed = line.trimEnd();
        if (trimmed.length === 0) {
          this.log("");
          continue;
        }
        this.log(`${indent}${pc.red(trimmed)}`);
      }
    }

    if (context) {
      this.contextPrinter.printContext(context, depth + 1);
    }

    for (const line of formattedStack) {
      this.log(`${indent}${pc.dim(line)}`);
    }

    if (truncated) {
      this.log(`${indent}${pc.dim("    …")}`);
    }
  }
}

export class ScenarioErrorRenderer {
  constructor(
    private readonly baselineRenderer: BaselineErrorRenderer,
    private readonly log: LogFn = console.log
  ) {}

  print(options: ScenarioOptions): void {
    const {
      context,
      depth,
      messageLines,
      formattedStack,
      truncated,
    } = options;

    const steps = context.steps ?? [];
    const failingIndex = steps.findIndex((step) => step.status === "failed");

    if (steps.length === 0 || failingIndex === -1) {
      this.baselineRenderer.print({
        context,
        depth,
        messageLines,
        formattedStack,
        truncated,
      });
      return;
    }

    const indent = "  ".repeat(depth);
    let detailsPrinted = false;

    for (const step of steps) {
      const { description, location } = describeStepSummary(step);
      const icon = getStepStatusIcon(step.status);
      const coloredDescription = colorizeStepDescription(description, step.status);
      const label = location ? `${coloredDescription}${location}` : coloredDescription;
      this.log(`${indent}${icon} ${label}`);

      if (!detailsPrinted && step.status === "failed") {
        this.baselineRenderer.print({
          context,
          depth: depth + 1,
          messageLines,
          formattedStack,
          truncated,
        });
        detailsPrinted = true;
      }
    }

    if (!detailsPrinted) {
      this.baselineRenderer.print({
        context,
        depth: depth + 1,
        messageLines,
        formattedStack,
        truncated,
      });
    }
  }
}
