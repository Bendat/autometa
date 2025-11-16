export type HookHandler = () => void | Promise<void>;

export type SuiteFn = {
  (title: string, handler: () => void, timeout?: number): void;
  skip: SuiteFn;
  only: SuiteFn;
  concurrent?: SuiteFn;
};

export type TestFn = {
  (title: string, handler: () => void | Promise<void>, timeout?: number): void;
  skip: TestFn;
  only: TestFn;
  concurrent?: TestFn;
  failing?: TestFn;
  fails?: TestFn;
  todo?: (title: string, reason?: string) => void;
  pending?: (title: string, reason?: string) => void;
};

export interface ExecutorRuntime {
  suite: SuiteFn;
  test: TestFn;
  beforeAll(handler: HookHandler, timeout?: number): void;
  afterAll(handler: HookHandler, timeout?: number): void;
  beforeEach(handler: HookHandler, timeout?: number): void;
  afterEach(handler: HookHandler, timeout?: number): void;
  currentTestName(): string | undefined;
  retry?(count: number): void;
  warn?(message: string): void;
  logError?(error: Error): void;
}
