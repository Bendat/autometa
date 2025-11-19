import pc from "picocolors";
import type { ScenarioStatus } from "./formatter";

export interface ReportNode {
  readonly type: "suite" | "test";
  readonly name: string;
  readonly status?: ScenarioStatus;
  readonly durationMs?: number;
  readonly error?: Error;
  readonly reason?: string;
  readonly children?: ReportNode[];
}

interface SuiteState {
  readonly name: string;
  readonly children: ReportNode[];
  passed: number;
  failed: number;
  skipped: number;
  pending: number;
}

export class HierarchicalReporter {
  private suiteStack: SuiteState[] = [];
  private currentSuite: SuiteState | undefined;
  private readonly rootSuites: ReportNode[] = [];

  enterSuite(name: string): void {
    const suite: SuiteState = {
      name,
      children: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      pending: 0,
    };

    if (this.currentSuite) {
      this.suiteStack.push(this.currentSuite);
    }

    this.currentSuite = suite;
  }

  exitSuite(): void {
    if (!this.currentSuite) return;

    const completed = this.currentSuite;
    const node: ReportNode = {
      type: "suite",
      name: completed.name,
      children: completed.children,
    };

    const parent = this.suiteStack.pop();
    if (parent) {
      parent.children.push(node);
      // Bubble up counts
      parent.passed += completed.passed;
      parent.failed += completed.failed;
      parent.skipped += completed.skipped;
      parent.pending += completed.pending;
      this.currentSuite = parent;
    } else {
      this.rootSuites.push(node);
      this.currentSuite = undefined;
    }
  }

  recordTest(
    name: string,
    status: ScenarioStatus,
    durationMs?: number,
    error?: Error,
    reason?: string
  ): void {
    const test: ReportNode = {
      type: "test",
      name,
      status,
      ...(durationMs !== undefined ? { durationMs } : {}),
      ...(error ? { error } : {}),
      ...(reason ? { reason } : {}),
    };

    if (this.currentSuite) {
      this.currentSuite.children.push(test);
      // Update counts
      switch (status) {
        case "passed":
          this.currentSuite.passed++;
          break;
        case "failed":
          this.currentSuite.failed++;
          break;
        case "skipped":
          this.currentSuite.skipped++;
          break;
        case "pending":
          this.currentSuite.pending++;
          break;
      }
    } else {
      this.rootSuites.push(test);
    }
  }

  print(): void {
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
    } else {
      // Test node
      if (!node.status) return; // Skip if no status
      
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
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (i === 0) {
        // Error message in red
        console.log(`${indent}${pc.red(line)}`);
      } else {
        // Stack trace dimmed
        console.log(`${indent}${pc.dim(line)}`);
      }
    }
  }
}
