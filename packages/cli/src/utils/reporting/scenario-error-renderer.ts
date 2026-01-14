import pc from "picocolors";

import type { GherkinErrorContext } from "@autometa/errors";

import { GherkinContextPrinter } from "./gherkin-context-printer";
import { describeStepSummary } from "./step-summary";
import { colorizeStepDescription, getStepStatusIcon } from "./status-formatters";
import {
  ImmediateHierarchicalLog,
  type HierarchicalLog,
} from "../logging/hierarchical-log";

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
    private readonly log: HierarchicalLog = new ImmediateHierarchicalLog()
  ) {}

  print(options: BaselineOptions): void {
    const {
      context,
      depth,
      messageLines,
      formattedStack,
      truncated,
    } = options;
    const scope = this.log.scoped(depth);

    if (messageLines.length > 0) {
      for (const line of messageLines) {
        const trimmed = line.trimEnd();
        if (trimmed.length === 0) {
          scope.write("");
          continue;
        }
        scope.write(pc.red(trimmed));
      }
    }

    if (context) {
      this.contextPrinter.printContext(context, depth + 1);
    }

    for (const line of formattedStack) {
      scope.write(pc.dim(line));
    }

    if (truncated) {
      scope.write(pc.dim("    …"));
    }
  }
}

export class ScenarioErrorRenderer {
  constructor(
    private readonly baselineRenderer: BaselineErrorRenderer,
    private readonly log: HierarchicalLog = new ImmediateHierarchicalLog()
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

    const scope = this.log.scoped(depth);
    let detailsPrinted = false;

    for (const step of steps) {
      const { description, location } = describeStepSummary(step);
      const icon = getStepStatusIcon(step.status);
      const coloredDescription = colorizeStepDescription(description, step.status);
      const label = location ? `${coloredDescription}${location}` : coloredDescription;
      scope.write(`${icon} ${label}`);

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
