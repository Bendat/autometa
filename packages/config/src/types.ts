export type TestExecutorConfig = {
  runner: "jest" | "vitest";
  environment?: string;
  test?: {
    timeout?: number;
    tagFilter?: string;
  };
};
