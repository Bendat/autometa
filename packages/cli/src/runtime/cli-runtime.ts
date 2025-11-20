import "source-map-support/register";

import type {
  ExecutorRuntime,
  HookHandler,
  SuiteFn,
  TestFn,
} from "@autometa/executor";

import type { RuntimeSummary, ScenarioReport } from "./types";
import {
  HierarchicalReporter,
  type RuntimeReporter,
  type RunEndEvent,
  type RunStartEvent,
  type SuiteLifecycleEvent,
  type TestResultEvent,
} from "../utils/reporter";

export type { RuntimeSummary, ScenarioReport } from "./types";

type Clock = {
  now(): number;
};

const clock: Clock =
  typeof globalThis.performance?.now === "function"
    ? globalThis.performance
    : { now: () => Date.now() };

export interface RuntimeOptions {
  readonly dryRun?: boolean;
  readonly reporters?: readonly RuntimeReporter[];
}

type SuiteMode = "default" | "skip" | "only" | "concurrent";
type TestKind = "test" | "todo" | "pending";

interface SuiteNode {
  readonly title: string;
  mode: SuiteMode;
  readonly timeout?: number;
  readonly parent?: SuiteNode;
  readonly children: Array<SuiteChild>;
}

type SuiteChild =
  | { readonly kind: "suite"; readonly node: SuiteNode }
  | { readonly kind: "test"; readonly node: TestNode };

interface TestNode {
  readonly title: string;
  readonly timeout?: number;
  readonly handler?: () => void | Promise<void>;
  readonly mode: SuiteMode;
  readonly kind: TestKind;
  readonly reason?: string;
}

interface ExecutionContext {
  readonly skip: boolean;
  readonly focus: boolean;
  readonly path: readonly string[];
}

export function createCliRuntime(options: RuntimeOptions = {}): {
  readonly runtime: ExecutorRuntime;
  execute(): Promise<RuntimeSummary>;
} {
  const root: SuiteNode = {
    title: "(root)",
    mode: "default",
    children: [],
  };
  let currentSuite = root;
  let hasFocusedBlock = false;
  let currentTestName: string | undefined;

  const state = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    pending: 0,
    success: true,
  };


  function registerSuite(
    mode: SuiteMode,
    title: string,
    handler?: () => void,
    timeout?: number
  ): void {
    const node: SuiteNode = {
      title,
      mode,
      ...(timeout !== undefined ? { timeout } : {}),
      ...(currentSuite === root ? {} : { parent: currentSuite }),
      children: [],
    };

    currentSuite.children.push({ kind: "suite", node });

    if (mode === "only") {
      hasFocusedBlock = true;
    }

    if (mode === "skip" || !handler) {
      return;
    }

    const previous = currentSuite;
    currentSuite = node;
    try {
      handler();
    } finally {
      currentSuite = previous;
    }
  }

  function registerTest(entry: {
    readonly title: string;
    readonly handler?: () => void | Promise<void>;
    readonly timeout?: number;
    readonly mode: SuiteMode;
    readonly kind: TestKind;
    readonly reason?: string;
  }): void {
    const node: TestNode = {
      title: entry.title,
      mode: entry.mode,
      kind: entry.kind,
      ...(entry.handler ? { handler: entry.handler } : {}),
      ...(entry.timeout !== undefined ? { timeout: entry.timeout } : {}),
      ...(entry.reason !== undefined ? { reason: entry.reason } : {}),
    };

    if (node.mode === "only") {
      hasFocusedBlock = true;
    }
    currentSuite.children.push({ kind: "test", node });
  }

  const suiteDefault = ((title: string, handler: () => void, timeout?: number) => {
    registerSuite("default", title, handler, timeout);
  }) as SuiteFn;

  const suiteSkip = ((title: string, _handler: () => void, timeout?: number) => {
    registerSuite("skip", title, undefined, timeout);
  }) as SuiteFn;

  const suiteOnly = ((title: string, handler: () => void, timeout?: number) => {
    registerSuite("only", title, handler, timeout);
  }) as SuiteFn;

  const suiteConcurrent = ((title: string, handler: () => void, timeout?: number) => {
    registerSuite("concurrent", title, handler, timeout);
  }) as SuiteFn;

  suiteDefault.skip = suiteSkip;
  suiteDefault.only = suiteOnly;
  suiteDefault.concurrent = suiteConcurrent;

  suiteSkip.skip = suiteSkip;
  suiteSkip.only = suiteOnly;
  suiteSkip.concurrent = suiteConcurrent;

  suiteOnly.skip = suiteSkip;
  suiteOnly.only = suiteOnly;
  suiteOnly.concurrent = suiteConcurrent;

  suiteConcurrent.skip = suiteSkip;
  suiteConcurrent.only = suiteOnly;
  suiteConcurrent.concurrent = suiteConcurrent;

  const suite = suiteDefault;

  const testDefault = ((
    title: string,
    handler: () => void | Promise<void>,
    timeout?: number
  ) => {
    registerTest({
      title,
      handler,
      ...(timeout !== undefined ? { timeout } : {}),
      mode: "default",
      kind: "test",
    });
  }) as TestFn;

  const testSkip = ((title: string, _handler?: () => void, timeout?: number) => {
    registerTest({
      title,
      ...(timeout !== undefined ? { timeout } : {}),
      mode: "skip",
      kind: "test",
    });
  }) as TestFn;

  const testOnly = ((
    title: string,
    handler: () => void | Promise<void>,
    timeout?: number
  ) => {
    registerTest({
      title,
      handler,
      ...(timeout !== undefined ? { timeout } : {}),
      mode: "only",
      kind: "test",
    });
  }) as TestFn;

  const testConcurrent = ((
    title: string,
    handler: () => void | Promise<void>,
    timeout?: number
  ) => {
    registerTest({
      title,
      handler,
      ...(timeout !== undefined ? { timeout } : {}),
      mode: "concurrent",
      kind: "test",
    });
  }) as TestFn;

  testDefault.skip = testSkip;
  testDefault.only = testOnly;
  testDefault.concurrent = testConcurrent;

  testSkip.skip = testSkip;
  testSkip.only = testOnly;
  testSkip.concurrent = testConcurrent;

  testOnly.skip = testSkip;
  testOnly.only = testOnly;
  testOnly.concurrent = testConcurrent;

  testConcurrent.skip = testSkip;
  testConcurrent.only = testOnly;
  testConcurrent.concurrent = testConcurrent;

  testDefault.todo = (title: string, reason?: string) => {
    registerTest({
      title,
      mode: "skip",
      kind: "todo",
      ...(reason !== undefined ? { reason } : {}),
    });
  };

  testDefault.pending = (title: string, reason?: string) => {
    registerTest({
      title,
      mode: "skip",
      kind: "pending",
      ...(reason !== undefined ? { reason } : {}),
    });
  };

  testSkip.todo = testDefault.todo;
  testSkip.pending = testDefault.pending;
  testOnly.todo = testDefault.todo;
  testOnly.pending = testDefault.pending;
  testConcurrent.todo = testDefault.todo;
  testConcurrent.pending = testDefault.pending;

  const test = testDefault;

  function invokeHook(handler: HookHandler): void {
    const outcome = handler();
    if (outcome && typeof (outcome as Promise<unknown>).then === "function") {
      void (outcome as Promise<unknown>).catch((error) => {
        console.error(error);
      });
    }
  }

  const runtime: ExecutorRuntime = {
    suite,
    test,
    beforeAll(handler: HookHandler): void {
      invokeHook(handler);
    },
    afterAll(handler: HookHandler): void {
      invokeHook(handler);
    },
    beforeEach(handler: HookHandler): void {
      invokeHook(handler);
    },
    afterEach(handler: HookHandler): void {
      invokeHook(handler);
    },
    currentTestName: () => currentTestName,
  };

  async function execute(): Promise<RuntimeSummary> {
    const startedAt = clock.now();
    const reports: ScenarioReport[] = [];
    const reporters: RuntimeReporter[] = [
      ...(options.reporters ? [...options.reporters] : [new HierarchicalReporter()]),
    ];

    await dispatchRunStart({ timestamp: startedAt });

    await runSuite(root, {
      skip: false,
      focus: false,
      path: [],
    });

    const finishedAt = clock.now();
    const summary: RuntimeSummary = {
      total: state.total,
      passed: state.passed,
      failed: state.failed,
      skipped: state.skipped,
      pending: state.pending,
      durationMs: finishedAt - startedAt,
      success: state.success,
      scenarios: reports,
    };

    await dispatchRunEnd({ timestamp: finishedAt, summary });

    return summary;

    async function runSuite(node: SuiteNode, context: ExecutionContext): Promise<void> {
      const skip = context.skip || node.mode === "skip";
      const focus = context.focus || node.mode === "only";
      const suitePath = node.parent ? [...context.path, node.title] : context.path;

      const shouldTrack = node.title && node.title !== "(root)";
      if (shouldTrack) {
        await dispatchSuiteStart({
          title: node.title,
          ancestors: context.path,
          path: suitePath,
        });
      }

      for (const child of node.children) {
        if (child.kind === "suite") {
          await runSuite(child.node, { skip, focus, path: suitePath });
          continue;
        }
        await runTest(child.node, suitePath, skip, focus);
      }

      if (shouldTrack) {
        await dispatchSuiteEnd({
          title: node.title,
          ancestors: context.path,
          path: suitePath,
        });
      }
    }

    async function runTest(
      node: TestNode,
      ancestors: readonly string[],
      skipBranch: boolean,
      focusBranch: boolean
    ): Promise<void> {
      const fullPath = [...ancestors, node.title];
      const fullName = fullPath.join(" › ");

      if (node.kind === "todo" || node.kind === "pending") {
        await record({
          status: "pending",
          name: node.title,
          fullName,
          ...(node.reason !== undefined ? { reason: node.reason } : {}),
        });
        return;
      }

      const skipDueToFocus = hasFocusedBlock && !focusBranch && node.mode !== "only";
      const shouldSkip = skipBranch || node.mode === "skip" || skipDueToFocus;

      if (options.dryRun) {
        await record({
          status: "pending",
          name: node.title,
          fullName,
          reason: "dry run",
        });
        return;
      }

      if (shouldSkip || !node.handler) {
        await record({
          status: "skipped",
          name: node.title,
          fullName,
        });
        return;
      }

      const startedAt = clock.now();
      currentTestName = fullName;

      try {
        const result = node.handler();
        if (result && typeof (result as Promise<unknown>).then === "function") {
          await (result as Promise<unknown>);
        }
        const duration = clock.now() - startedAt;
        await record({
          status: "passed",
          name: node.title,
          fullName,
          durationMs: duration,
        });
      } catch (error) {
        const duration = clock.now() - startedAt;
        await record({
          status: "failed",
          name: node.title,
          fullName,
          durationMs: duration,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      } finally {
        currentTestName = undefined;
      }
    }

    async function record(report: ScenarioReport): Promise<void> {
      state.total += 1;
      switch (report.status) {
        case "passed":
          state.passed += 1;
          break;
        case "failed":
          state.failed += 1;
          state.success = false;
          break;
        case "skipped":
          state.skipped += 1;
          break;
        case "pending":
          state.pending += 1;
          break;
        default:
          break;
      }

      reports.push(report);
      await dispatchTestResult({ result: report });
    }

    async function dispatchRunStart(event: RunStartEvent): Promise<void> {
      for (const reporter of reporters) {
        if (typeof reporter.onRunStart === "function") {
          await reporter.onRunStart(event);
        }
      }
    }

    async function dispatchSuiteStart(event: SuiteLifecycleEvent): Promise<void> {
      for (const reporter of reporters) {
        if (typeof reporter.onSuiteStart === "function") {
          await reporter.onSuiteStart(event);
        }
      }
    }

    async function dispatchSuiteEnd(event: SuiteLifecycleEvent): Promise<void> {
      for (const reporter of reporters) {
        if (typeof reporter.onSuiteEnd === "function") {
          await reporter.onSuiteEnd(event);
        }
      }
    }

    async function dispatchTestResult(event: TestResultEvent): Promise<void> {
      for (const reporter of reporters) {
        if (typeof reporter.onTestResult === "function") {
          await reporter.onTestResult(event);
        }
      }
    }

    async function dispatchRunEnd(event: RunEndEvent): Promise<void> {
      for (const reporter of reporters) {
        if (typeof reporter.onRunEnd === "function") {
          await reporter.onRunEnd(event);
        }
      }
    }
  }

  return {
    runtime,
    async execute(): Promise<RuntimeSummary> {
      return execute();
    },
  };
}
