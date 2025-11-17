import type {
  ExecutorRuntime,
  HookHandler,
  SuiteFn,
  TestFn,
} from "@autometa/executor";

type Clock = {
  now(): number;
};

const clock: Clock =
  typeof globalThis.performance?.now === "function"
    ? globalThis.performance
    : { now: () => Date.now() };

export type ScenarioStatus = "passed" | "failed" | "skipped" | "pending";

export interface ScenarioReport {
  readonly name: string;
  readonly fullName: string;
  readonly status: ScenarioStatus;
  readonly durationMs?: number;
  readonly error?: Error;
  readonly reason?: string;
}

export interface RuntimeSummary {
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly skipped: number;
  readonly pending: number;
  readonly durationMs: number;
  readonly success: boolean;
  readonly scenarios: readonly ScenarioReport[];
}

export interface RuntimeOptions {
  readonly dryRun?: boolean;
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

    await runSuite(root, {
      skip: false,
      focus: false,
      path: [],
    });

    const finishedAt = clock.now();
    return {
      total: state.total,
      passed: state.passed,
      failed: state.failed,
      skipped: state.skipped,
      pending: state.pending,
      durationMs: finishedAt - startedAt,
      success: state.success,
      scenarios: reports,
    };

    async function runSuite(node: SuiteNode, context: ExecutionContext): Promise<void> {
      const skip = context.skip || node.mode === "skip";
      const focus = context.focus || node.mode === "only";
      const path = node.parent ? [...context.path, node.title] : context.path;

      for (const child of node.children) {
        if (child.kind === "suite") {
          await runSuite(child.node, { skip, focus, path });
          continue;
        }
        await runTest(child.node, path, skip, focus);
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
        record({
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
        record({
          status: "pending",
          name: node.title,
          fullName,
          reason: "dry run",
        });
        return;
      }

      if (shouldSkip || !node.handler) {
        record({
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
        record({
          status: "passed",
          name: node.title,
          fullName,
          durationMs: duration,
        });
      } catch (error) {
        const duration = clock.now() - startedAt;
        record({
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

    function record(report: ScenarioReport): void {
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

      console.log(formatReport(report));
      if (report.error) {
        console.error(indentMessage(report.error.stack ?? report.error.message));
      } else if (report.reason) {
        console.log(indentMessage(`Reason: ${report.reason}`));
      }

      reports.push(report);
    }
  }

  return {
    runtime,
    async execute(): Promise<RuntimeSummary> {
      return execute();
    },
  };
}

function formatReport(report: ScenarioReport): string {
  const label = statusLabel(report.status);
  const duration = report.durationMs !== undefined ? formatDuration(report.durationMs) : "";
  return duration ? `${label} ${report.fullName} (${duration})` : `${label} ${report.fullName}`;
}

function statusLabel(status: ScenarioStatus): string {
  switch (status) {
    case "passed":
      return "PASS";
    case "failed":
      return "FAIL";
    case "skipped":
      return "SKIP";
    case "pending":
      return "PEND";
    default:
      return assertUnreachable(status);
  }
}

function formatDuration(value: number): string {
  if (value < 1) {
    return `${value.toFixed(2)} ms`;
  }
  if (value < 1000) {
    return `${value.toFixed(0)} ms`;
  }
  return `${(value / 1000).toFixed(2)} s`;
}

function indentMessage(message: string): string {
  return message
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n");
}

function assertUnreachable(value: never): never {
  throw new Error(`Unhandled scenario status: ${String(value)}`);
}
