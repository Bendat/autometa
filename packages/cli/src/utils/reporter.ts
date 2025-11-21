import pc from "picocolors";

import { getGherkinErrorContext } from "@autometa/errors";
import type { HookLogEvent, HookLogPathSegment } from "@autometa/executor";
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

type ReportNode = SuiteReportNode | TestReportNode | LogReportNode;

type HookTargetKind = "feature" | "rule" | "scenario" | "scenarioOutline" | "step";

interface HookLogFormattingContext {
  readonly scenarioName?: string;
}

interface SuiteReportNode {
  readonly type: "suite";
  readonly name: string;
  readonly children: ReportNode[];
}

interface TestReportNode {
  readonly type: "test";
  readonly name: string;
  status?: ScenarioStatus;
  durationMs?: number;
  error?: Error;
  reason?: string;
  readonly logs: LogReportNode[];
}

interface LogReportNode {
  readonly type: "log";
  readonly message: string;
  readonly offset: number;
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
  onHookLog?(event: HookLogEvent): void;
  onRunEnd?(event: RunEndEvent): void | Promise<void>;
}

interface SuiteState {
  readonly node: SuiteReportNode;
}

export interface HierarchicalReporterOptions {
  readonly showGherkinStack?: boolean;
  readonly bufferOutput?: boolean;
}

export class HierarchicalReporter implements RuntimeReporter {
  private suiteStack: SuiteState[] = [];
  private rootSuites: SuiteReportNode[] = [];
  private readonly log: HierarchicalLog;
  private readonly gherkinContextPrinter: GherkinContextPrinter;
  private readonly baselineErrorRenderer: BaselineErrorRenderer;
  private readonly scenarioErrorRenderer: ScenarioErrorRenderer;
  private readonly testNodesByFullName = new Map<string, TestReportNode>();

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
    const parentNames = event.ancestors;
    const parentSuite = parentNames.length > 0 ? this.ensureSuitePathByNames(parentNames) : undefined;

    let suiteNode: SuiteReportNode | undefined;
    if (parentSuite) {
      suiteNode = this.findSuite(parentSuite.children, event.title);
    } else {
      suiteNode = this.findSuite(this.rootSuites, event.title);
    }

    if (!suiteNode) {
      suiteNode = {
        type: "suite",
        name: event.title,
        children: [],
      };
      if (parentSuite) {
        parentSuite.children.push(suiteNode);
      } else {
        this.rootSuites.push(suiteNode);
      }
    }

    this.suiteStack.push({ node: suiteNode });
  }

  async onSuiteEnd(): Promise<void> {
    this.suiteStack.pop();
  }

  async onTestResult(event: TestResultEvent): Promise<void> {
    const fullName = event.result.fullName;
    const segments = fullName.split(" › ");
    const suiteNames = segments.slice(0, -1);
    const parentSuite = this.ensureSuitePathByNames(suiteNames);

    let testNode = this.testNodesByFullName.get(fullName);
    if (!testNode) {
      testNode = {
        type: "test",
        name: event.result.name,
        logs: [],
      };
      parentSuite.children.push(testNode);
      this.testNodesByFullName.set(fullName, testNode);
    }

    testNode.status = event.result.status;
    if (event.result.durationMs !== undefined) {
      testNode.durationMs = event.result.durationMs;
    } else {
      delete testNode.durationMs;
    }
    if (event.result.error) {
      testNode.error = event.result.error;
    } else {
      delete testNode.error;
    }
    if (event.result.reason) {
      testNode.reason = event.result.reason;
    } else {
      delete testNode.reason;
    }
  }

  onHookLog(event: HookLogEvent): void {
    const suiteNames = this.extractSuiteNames(event.path);
    const scenarioSegment = this.findScenarioSegment(event.path);
    const scenarioName = event.scenario?.name ?? scenarioSegment?.name;
    const context: HookLogFormattingContext = {
      ...(scenarioName ? { scenarioName } : {}),
    };

    const formatted = this.formatHookMessage(event, context);

    if (suiteNames.length === 0 && !scenarioSegment) {
      this.log.write(formatted, 0);
      return;
    }

    const parentSuite = this.ensureSuitePathByNames(suiteNames);

    if (scenarioSegment) {
      const testNode = this.ensureTestNode(parentSuite, suiteNames, scenarioSegment, event);
      const offset = event.step ? 1 : 0;
      testNode.logs.push({
        type: "log",
        message: formatted,
        offset,
      });
      return;
    }

    parentSuite.children.push({
      type: "log",
      message: formatted,
      offset: 0,
    });
  }

  async onRunEnd(): Promise<void> {
    this.flush();
  }

  private reset(): void {
    this.suiteStack = [];
    this.rootSuites = [];
    this.testNodesByFullName.clear();
  }

  private flush(): void {
    for (const suite of this.rootSuites) {
      this.printNode(suite, 0);
    }
    this.log.flush();
  }

  private printNode(node: ReportNode, depth: number): void {
    if (node.type === "suite") {
      const isSyntheticRoot = node.name === "(root)";
      const nextDepth = isSyntheticRoot ? depth : depth + 1;

      if (!isSyntheticRoot) {
        const label = depth === 0 ? `Feature: ${node.name}` : node.name;
        this.log.write(pc.bold(label), depth);
      }

      for (const child of node.children) {
        if (child.type === "log") {
          this.log.write(child.message, nextDepth + child.offset);
          continue;
        }
        this.printNode(child, nextDepth);
      }
      return;
    }

    if (node.type === "log") {
      this.log.write(node.message, depth + node.offset);
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

    const scenarioLabel = `${pc.bold("Scenario:")} ${coloredName}`;
    this.log.write(`${icon} ${scenarioLabel}${duration}`, depth);

    for (const logEntry of node.logs) {
      this.log.write(logEntry.message, depth + 1 + logEntry.offset);
    }

    if (node.error) {
      this.printError(node.error, depth + 1);
    } else if (node.reason) {
      this.log.write(pc.dim(`Reason: ${node.reason}`), depth + 1);
    }
  }

  private ensureSuitePathByNames(names: readonly string[]): SuiteReportNode {
    if (names.length === 0) {
      if (this.rootSuites.length === 0) {
        const rootSuite: SuiteReportNode = { type: "suite", name: "(root)", children: [] };
        this.rootSuites.push(rootSuite);
        return rootSuite;
      }
      const [first] = this.rootSuites;
      if (first) {
        return first;
      }
      const fallback: SuiteReportNode = { type: "suite", name: "(root)", children: [] };
      this.rootSuites.push(fallback);
      return fallback;
    }

    let currentChildren: ReportNode[] = this.rootSuites;
    let currentSuite: SuiteReportNode | undefined;

    for (const name of names) {
      let suite = this.findSuite(currentChildren, name);
      if (!suite) {
        suite = { type: "suite", name, children: [] };
        currentChildren.push(suite);
      }
      currentSuite = suite;
      currentChildren = suite.children;
    }

    if (!currentSuite) {
      return this.ensureSuitePathByNames([]);
    }

    return currentSuite;
  }

  private findSuite(children: readonly ReportNode[], name: string): SuiteReportNode | undefined {
    for (const child of children) {
      if (child.type === "suite" && child.name === name) {
        return child;
      }
    }
    return undefined;
  }

  private ensureTestNode(
    parentSuite: SuiteReportNode,
    suiteNames: readonly string[],
    scenarioSegment: HookLogPathSegment,
    event: HookLogEvent
  ): TestReportNode {
    const fullName = event.scenario?.fullName ?? [...suiteNames, scenarioSegment.name].join(" › ");
    let node = this.testNodesByFullName.get(fullName);
    if (!node) {
      node = {
        type: "test",
        name: event.scenario?.name ?? scenarioSegment.name,
        logs: [],
      };
      parentSuite.children.push(node);
      this.testNodesByFullName.set(fullName, node);
    }
    return node;
  }

  private extractSuiteNames(path: readonly HookLogPathSegment[]): string[] {
    const suites: string[] = [];
    for (const segment of path) {
      if (!segment) {
        continue;
      }
      if (
        segment.kind === "feature"
        || segment.kind === "rule"
        || segment.kind === "scenarioOutline"
      ) {
        suites.push(segment.name);
      }
    }
    return suites;
  }

  private findScenarioSegment(
    path: readonly HookLogPathSegment[]
  ): HookLogPathSegment | undefined {
    for (let index = path.length - 1; index >= 0; index -= 1) {
      const segment = path[index];
      if (!segment) {
        continue;
      }
      if (segment.kind === "scenario") {
        return segment;
      }
    }
    return undefined;
  }

  private formatHookMessage(event: HookLogEvent, context: HookLogFormattingContext): string {
    const kind = this.getHookTargetKind(event.hookType);
    if (kind === "step") {
      return this.formatStepHookMessage(event, context);
    }
    return this.formatContainerHookMessage(event, kind, context);
  }

  private getHookTargetKind(hookType: HookLogEvent["hookType"]): HookTargetKind {
    switch (hookType) {
      case "beforeFeature":
      case "afterFeature":
        return "feature";
      case "beforeRule":
      case "afterRule":
        return "rule";
      case "beforeScenario":
      case "afterScenario":
      case "beforeStep":
      case "afterStep":
        return hookType === "beforeStep" || hookType === "afterStep" ? "step" : "scenario";
      case "beforeScenarioOutline":
      case "afterScenarioOutline":
        return "scenarioOutline";
      default:
        return "scenario";
    }
  }

  private formatStepHookMessage(event: HookLogEvent, context: HookLogFormattingContext): string {
    const phaseLabel = this.wrapPhaseLabel(event.phase);
    const stepKeyword = this.extractStepKeyword(event) ?? "Step";
    const coloredKeyword = this.wrapStepKeyword(stepKeyword);
    const text = this.extractStepText(event, context);
    const status = this.describeStepStatus(event.step?.status);

    const parts: string[] = [phaseLabel, coloredKeyword];

    if (text && text.length > 0) {
      parts.push(text);
    }

    if (status) {
      parts.push(status);
    }

    return parts.join(" ");
  }

  private formatContainerHookMessage(
    event: HookLogEvent,
    kind: HookTargetKind,
    context: HookLogFormattingContext
  ): string {
    const phaseLabel = this.wrapPhaseLabel(event.phase);
    const keyword = this.resolveTargetKeyword(kind, event) ?? this.describeFallbackTarget(kind, event);
    const coloredKeyword = keyword ? this.wrapContainerKeyword(keyword) : undefined;
    const message = this.sanitizeHookMessage(event.message, context);

    if (coloredKeyword && message) {
      return `${phaseLabel} ${coloredKeyword}: ${message}`;
    }

    if (coloredKeyword) {
      return `${phaseLabel} ${coloredKeyword}`;
    }

    if (message) {
      return `${phaseLabel} ${message}`;
    }

    return phaseLabel;
  }

  private extractStepText(event: HookLogEvent, context: HookLogFormattingContext): string | undefined {
    const text = event.step?.text?.trim();
    if (text && text.length > 0) {
      return text;
    }
    return this.sanitizeHookMessage(event.message, context);
  }

  private sanitizeHookMessage(message: string | undefined, context: HookLogFormattingContext): string | undefined {
    if (!message) {
      return undefined;
    }

    let result = message.trim();

    if (context.scenarioName) {
      const escaped = HierarchicalReporter.escapeRegExp(context.scenarioName);
      const patterns = [
        new RegExp(`^Scenario\\s+"?${escaped}"?\\s*::\\s*`, "i"),
        new RegExp(`^Scenario\\s+"?${escaped}"?\\s*`, "i"),
      ];

      for (const pattern of patterns) {
        const updated = result.replace(pattern, "").trim();
        if (updated !== result) {
          result = updated;
          break;
        }
      }
    }

    return result;
  }

  private wrapPhaseLabel(phase: HookLogEvent["phase"]): string {
    const label = phase === "before" ? "Before" : "After";
    return phase === "before" ? pc.cyan(label) : pc.magenta(label);
  }

  private wrapStepKeyword(keyword: string): string {
    const normalized = keyword.trim().toLowerCase();
    switch (normalized) {
      case "given":
        return pc.blue(keyword);
      case "when":
        return pc.yellow(keyword);
      case "then":
        return pc.green(keyword);
      case "and":
      case "but":
        return pc.cyan(keyword);
      default:
        return pc.white(keyword);
    }
  }

  private wrapContainerKeyword(keyword: string): string {
    return pc.bold(keyword);
  }

  private describeStepStatus(status: string | undefined): string | undefined {
    if (!status) {
      return undefined;
    }

    switch (status.toLowerCase()) {
      case "passed":
        return pc.dim("(passed)");
      case "failed":
        return pc.red("(failed)");
      case "skipped":
        return pc.yellow("(skipped)");
      default:
        return pc.dim(`(${status})`);
    }
  }

  private static escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  }

  private resolveTargetKeyword(kind: HookTargetKind, event: HookLogEvent): string | undefined {
    const normalized = (value: string | undefined): string | undefined => {
      if (!value) {
        return undefined;
      }
      return this.cleanKeyword(value);
    };

    if (kind === "scenario") {
      return (
        normalized(event.scenario?.keyword)
        ?? normalized(event.targetKeyword)
        ?? normalized(this.findSegmentKeyword(kind, event.path))
      );
    }

    if (kind === "scenarioOutline") {
      return (
        normalized(event.targetKeyword)
        ?? normalized(this.findSegmentKeyword(kind, event.path))
      );
    }

    if (kind === "feature" || kind === "rule") {
      return (
        normalized(event.targetKeyword)
        ?? normalized(this.findSegmentKeyword(kind, event.path))
      );
    }

    return undefined;
  }

  private describeFallbackTarget(kind: HookTargetKind, _event: HookLogEvent): string {
    switch (kind) {
      case "feature":
        return "Feature";
      case "rule":
        return "Rule";
      case "scenario":
        return "Scenario";
      case "scenarioOutline":
        return "Scenario Outline";
      case "step":
      default:
        return "Step";
    }
  }

  private extractStepKeyword(event: HookLogEvent): string | undefined {
    const keyword = event.step?.keyword;
    if (!keyword || keyword.trim().length === 0) {
      return undefined;
    }
    return this.cleanKeyword(keyword);
  }

  private findSegmentKeyword(
    kind: HookTargetKind,
    path: readonly HookLogPathSegment[]
  ): string | undefined {
    for (let index = path.length - 1; index >= 0; index -= 1) {
      const segment = path[index];
      if (!segment) {
        continue;
      }
      if (segment.kind === kind && segment.keyword) {
        return segment.keyword;
      }
    }
    return undefined;
  }

  private cleanKeyword(keyword: string): string {
    return keyword.trim().replace(/:\s*$/u, "");
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
