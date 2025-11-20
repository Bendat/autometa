import fs from "node:fs";
import path from "node:path";

import { codeFrameColumns } from "@babel/code-frame";
import pc from "picocolors";

import {
  getGherkinErrorContext,
  type GherkinErrorContext,
  type SourceLocation,
} from "@autometa/errors";
import type {
  RuntimeSummary,
  ScenarioReport,
  ScenarioStatus,
} from "../runtime/types";

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

export class HierarchicalReporter implements RuntimeReporter {
  private suiteStack: SuiteState[] = [];
  private rootSuites: ReportNode[] = [];

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
  }

  private printNode(node: ReportNode, depth: number): void {
    const indent = "  ".repeat(depth);

    if (node.type === "suite") {
      console.log(`${indent}${pc.bold(node.name)}`);
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

    const icon = this.getStatusIcon(node.status);
    const coloredName = this.colorizeByStatus(node.name, node.status);
    const duration = node.durationMs !== undefined
      ? pc.dim(` (${this.formatDuration(node.durationMs)})`)
      : "";

    console.log(`${indent}${icon} ${coloredName}${duration}`);

    if (node.error) {
      this.printError(node.error, depth + 1);
    } else if (node.reason) {
      console.log(`${indent}  ${pc.dim(`Reason: ${node.reason}`)}`);
    }
  }

  private getStatusIcon(status: ScenarioStatus): string {
    switch (status) {
      case "passed":
        return pc.green("✓");
      case "failed":
        return pc.red("✗");
      case "skipped":
        return pc.yellow("○");
      case "pending":
        return pc.cyan("◌");
    }
  }

  private colorizeByStatus(text: string, status: ScenarioStatus): string {
    switch (status) {
      case "passed":
        return pc.green(text);
      case "failed":
        return pc.red(text);
      case "skipped":
        return pc.yellow(text);
      case "pending":
        return pc.cyan(text);
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
    const indent = "  ".repeat(depth);
    const stack = error.stack ?? error.message;
    const lines = stack.split("\n");

    if (lines.length === 0) {
      console.log(`${indent}${pc.red(error.message)}`);
      return;
    }

    const [headline, ...rest] = lines;
    console.log(`${indent}${pc.red(headline)}`);

    const { messageLines, stackLines } = this.partitionErrorLines(rest);

    if (messageLines.length > 0) {
      for (const line of messageLines) {
        const trimmed = line.trimEnd();
        if (trimmed.length === 0) {
          console.log("");
          continue;
        }
        console.log(`${indent}${pc.red(trimmed)}`);
      }
    }

    const context = getGherkinErrorContext(error);
    if (context) {
      this.printGherkinContext(context, depth + 1);
    }

    const { lines: formattedStack, truncated } = this.formatStackLines(stackLines, 4);
    for (const line of formattedStack) {
      console.log(`${indent}${pc.dim(line)}`);
    }

    if (truncated) {
      console.log(`${indent}${pc.dim("    …")}`);
    }
  }

  private formatStackLines(
    lines: readonly string[],
    limit: number
  ): { lines: string[]; truncated: boolean } {
    const cwd = process.cwd();
    const max = Math.max(limit, 0);
    const normalized: Array<{ text: string; framework: boolean }> = [];
    let count = 0;

    for (const line of lines) {
      if (max && count >= max) {
        return { lines: this.filterFrameworkFrames(normalized), truncated: true };
      }
      const info = this.normalizeStackLine(line.trimEnd(), cwd);
      normalized.push({
        text: info.text,
        framework: info.relativePath ? this.isFrameworkPath(info.relativePath) : false,
      });
      count += 1;
    }

    return { lines: this.filterFrameworkFrames(normalized), truncated: false };
  }

  private normalizeStackLine(
    line: string,
    cwd: string
  ): { text: string; relativePath?: string } {
    // eslint-disable-next-line no-useless-escape
    const stackRegex = /(.*?\()?(?<filepath>(?:[a-zA-Z]:)?[\\/][^:\)]+)(?<position>:\d+:\d+)(\))?/;
    const match = line.match(stackRegex);

    if (!match || !match.groups) {
      return { text: line };
    }

    const { filepath, position } = match.groups as { filepath: string; position: string };
    const absolute = path.normalize(filepath);
    const relative = path.relative(cwd, absolute) || absolute;

    return {
      text: line.replace(`${filepath}${position}`, `${relative}${position}`),
      relativePath: relative,
    };
  }

  private filterFrameworkFrames(frames: Array<{ text: string; framework: boolean }>): string[] {
    if (frames.length === 0) {
      return [];
    }

    const filtered = frames.filter((frame, index) => index === 0 || !frame.framework);
    if (filtered.length === 0) {
      return frames.map((frame) => frame.text);
    }

    return filtered.map((frame) => frame.text);
  }

  private isFrameworkPath(relativePath: string): boolean {
    const normalized = relativePath.split(path.sep).join("/");
    return (
      normalized.includes("node_modules/") ||
      normalized.startsWith("packages/runner/") ||
      normalized.startsWith("packages/executor/")
    );
  }

  private printGherkinContext(context: GherkinErrorContext, depth: number): void {
    if (context.gherkin) {
      const details = this.describeGherkinSegment(context.gherkin);
      const pathSegments = context.path;
      this.printCodeFrameSection(
        "Gherkin",
        context.gherkin.location,
        details,
        depth,
        {
          includeLocation: !pathSegments || pathSegments.length === 0,
        }
      );

    }

    if (context.code) {
      const details = this.describeCodeSegment(context.code);
      this.printCodeFrameSection("Step implementation", context.code.location, details, depth);
    }
  }

  private printCodeFrameSection(
    title: string,
    location: SourceLocation,
    details: string | undefined,
    depth: number,
    options: { includeLocation?: boolean } = {}
  ): void {
    const indent = "  ".repeat(depth);
    const headerParts = [title];
    if (details) {
      headerParts.push(details);
    }
    if (options.includeLocation !== false) {
      headerParts.push(pc.dim(this.formatSourceLocation(location)));
    }
    console.log(`${indent}${pc.cyan(headerParts.join(" - "))}`);

    const frame = this.buildCodeFrame(location);
    if (!frame) {
      console.log(`${indent}  ${pc.dim("Unable to read source snippet")}`);
      return;
    }

    for (const line of frame) {
      console.log(`${indent}  ${line}`);
    }
  }

  private buildCodeFrame(location: SourceLocation): readonly string[] | undefined {
    try {
      const contents = fs.readFileSync(location.filePath, "utf8");
      const frame = codeFrameColumns(
        contents,
        {
          start: location.start,
          ...(location.end ? { end: location.end } : {}),
        },
        {
          linesAbove: 2,
          linesBelow: 2,
          highlightCode: true,
        }
      );
      return frame.split("\n");
    } catch {
      return undefined;
    }
  }

  private describeGherkinSegment(
    segment: GherkinErrorContext["gherkin"]
  ): string | undefined {
    if (!segment) {
      return undefined;
    }
    const keyword = segment.stepKeyword?.trim();
    const text = segment.stepText?.trim();
    const parts = [keyword, text].filter((value): value is string => Boolean(value && value.length));
    if (parts.length) {
      return parts.join(" ");
    }
    if (segment.featureName) {
      return `Feature: ${segment.featureName}`;
    }
    return undefined;
  }

  private describeCodeSegment(segment: GherkinErrorContext["code"]): string | undefined {
    if (!segment) {
      return undefined;
    }
    return segment.functionName ?? undefined;
  }

  private formatSourceLocation(location: SourceLocation): string {
    return `${this.relativePath(location.filePath)}:${location.start.line}:${location.start.column}`;
  }

  private relativePath(filePath: string): string {
    const cwd = process.cwd();
    const relative = path.relative(cwd, filePath);
    return relative || filePath;
  }

  private partitionErrorLines(lines: readonly string[]): {
    messageLines: string[];
    stackLines: string[];
  } {
    const messageLines: string[] = [];
    const stackLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (this.isStackLine(trimmed)) {
        stackLines.push(line);
      } else {
        messageLines.push(line);
      }
    }

    // Remove trailing blank lines from message block for tidier output
    while (messageLines.length > 0) {
      const last = messageLines[messageLines.length - 1];
      if (!last || last.trim().length === 0) {
        messageLines.pop();
        continue;
      }
      break;
    }

    return { messageLines, stackLines };
  }

  private isStackLine(line: string): boolean {
    if (!line) {
      return false;
    }
    if (line.startsWith("at ")) {
      return true;
    }
    return /\((?:[a-zA-Z]:)?[^():]+:\d+:\d+\)$/.test(line);
  }
}
