import pc from "picocolors";

import { getGherkinErrorContext } from "@autometa/errors";
import type {
  RuntimeSummary,
  ScenarioReport,
  ScenarioStatus,
} from "../runtime/types";
import { BaselineErrorRenderer, ScenarioErrorRenderer } from "./reporting/scenario-error-renderer";
import { GherkinContextPrinter, type GherkinContextPrinterOptions } from "./reporting/gherkin-context-printer";
import { colorizeScenarioStatus, getScenarioStatusIcon } from "./reporting/status-formatters";
import { formatStackLines, partitionErrorLines } from "./reporting/stack-utils";
import {
  BufferedHierarchicalLog,
  ImmediateHierarchicalLog,
  type HierarchicalLog,
} from "./logging/hierarchical-log";

export interface ReportNode {
  readonly type: "suite" | "test";
  readonly name: string;
  readonly status?: ScenarioStatus;
  readonly durationMs?: number;
  readonly error?: Error;
  readonly reason?: string;
  readonly children?: ReportNode[];
}

export interface RunStartEvent {
  readonly timestamp: number;
}

export interface SuiteLifecycleEvent {
  readonly title: string;
  readonly ancestors: readonly string[];
  readonly path: readonly string[];
}

export interface TestResultEvent {
  readonly result: ScenarioReport;
}

export interface RunEndEvent {
  readonly timestamp: number;
  readonly summary: RuntimeSummary;
}

export interface RuntimeReporter {
  onRunStart?(event: RunStartEvent): void | Promise<void>;
  onSuiteStart?(event: SuiteLifecycleEvent): void | Promise<void>;
  onSuiteEnd?(event: SuiteLifecycleEvent): void | Promise<void>;
  onTestResult?(event: TestResultEvent): void | Promise<void>;
  onRunEnd?(event: RunEndEvent): void | Promise<void>;
}

interface SuiteState {
  readonly node: ReportNode & { readonly children: ReportNode[] };
}

export interface HierarchicalReporterOptions {
  readonly showGherkinStack?: boolean;
  readonly bufferOutput?: boolean;
}

export class HierarchicalReporter implements RuntimeReporter {
  private suiteStack: SuiteState[] = [];
  private rootSuites: ReportNode[] = [];
  private readonly log: HierarchicalLog;
  private readonly gherkinContextPrinter: GherkinContextPrinter;
  private readonly baselineErrorRenderer: BaselineErrorRenderer;
  private readonly scenarioErrorRenderer: ScenarioErrorRenderer;

  constructor(log: (line: string) => void = console.log, options: HierarchicalReporterOptions = {}) {
    const useBuffer = options.bufferOutput ?? true;
    this.log = useBuffer ? new BufferedHierarchicalLog(log) : new ImmediateHierarchicalLog(log);
    const includeGherkinContext = options.showGherkinStack ?? false;
    const printerOptions: GherkinContextPrinterOptions = {
      includePath: includeGherkinContext,
      includeCodeFrame: includeGherkinContext,
    };
    this.gherkinContextPrinter = new GherkinContextPrinter(this.log, printerOptions);
    this.baselineErrorRenderer = new BaselineErrorRenderer(this.gherkinContextPrinter, this.log);
    this.scenarioErrorRenderer = new ScenarioErrorRenderer(this.baselineErrorRenderer, this.log);
  }

  async onRunStart(): Promise<void> {
    this.reset();
  }

  async onSuiteStart(event: SuiteLifecycleEvent): Promise<void> {
    const suiteNode: ReportNode & { readonly children: ReportNode[] } = {
      type: "suite",
      name: event.title,
      children: [],
    };

    const parent = this.suiteStack[this.suiteStack.length - 1];
    if (parent) {
      parent.node.children.push(suiteNode);
    } else {
      this.rootSuites.push(suiteNode);
    }

    this.suiteStack.push({ node: suiteNode });
  }

  async onSuiteEnd(): Promise<void> {
    this.suiteStack.pop();
  }

  async onTestResult(event: TestResultEvent): Promise<void> {
    const testNode: ReportNode = {
      type: "test",
      name: event.result.name,
      status: event.result.status,
      ...(event.result.durationMs !== undefined
        ? { durationMs: event.result.durationMs }
        : {}),
      ...(event.result.error ? { error: event.result.error } : {}),
      ...(event.result.reason ? { reason: event.result.reason } : {}),
    };

    const currentSuite = this.suiteStack[this.suiteStack.length - 1];
    if (currentSuite) {
      currentSuite.node.children.push(testNode);
    } else {
      this.rootSuites.push(testNode);
    }
  }

  async onRunEnd(): Promise<void> {
    this.flush();
  }

  private reset(): void {
    this.suiteStack = [];
    this.rootSuites = [];
  }

  private flush(): void {
    for (const suite of this.rootSuites) {
      this.printNode(suite, 0);
    }
    this.log.flush();
  }

  private printNode(node: ReportNode, depth: number): void {
    if (node.type === "suite") {
      this.log.write(pc.bold(node.name), depth);
      if (node.children) {
        for (const child of node.children) {
          this.printNode(child, depth + 1);
        }
      }
      return;
    }

    if (!node.status) {
      return;
    }

    const icon = getScenarioStatusIcon(node.status);
    const coloredName = colorizeScenarioStatus(node.name, node.status);
    const duration = node.durationMs !== undefined
      ? pc.dim(` (${this.formatDuration(node.durationMs)})`)
      : "";

    this.log.write(`${icon} ${coloredName}${duration}`, depth);

    if (node.error) {
      this.printError(node.error, depth + 1);
    } else if (node.reason) {
      this.log.write(pc.dim(`Reason: ${node.reason}`), depth + 1);
    }
  }

  private formatDuration(ms: number): string {
    if (ms < 1) {
      return `${ms.toFixed(2)} ms`;
    }
    if (ms < 1000) {
      return `${ms.toFixed(0)} ms`;
    }
    return `${(ms / 1000).toFixed(2)} s`;
  }

  private printError(error: Error, depth: number): void {
    const stack = error.stack ?? error.message;
    const lines = stack.split("\n");

    if (lines.length === 0) {
      this.log.write(pc.red(error.message), depth);
      return;
    }

    const [headline, ...rest] = lines;
    this.log.write(pc.red(headline), depth);

    const { messageLines, stackLines } = partitionErrorLines(rest);
    const { lines: formattedStack, truncated } = formatStackLines(stackLines, 4);
    const context = getGherkinErrorContext(error);

    if (context?.steps && context.steps.length > 0) {
      this.scenarioErrorRenderer.print({
        context,
        depth,
        messageLines,
        formattedStack,
        truncated,
      });
      return;
    }

    this.baselineErrorRenderer.print({
      ...(context ? { context } : {}),
      depth,
      messageLines,
      formattedStack,
      truncated,
    });
  }

}
