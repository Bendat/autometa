import { Class } from "@autometa/types";
import { object, function as fun, string, tuple, number } from "zod";
import { HookWrapper, Test, TestGroup, TimeoutFunction } from "./types";
import { App, World } from "@autometa/app";

export const TestExecutorConfigSchema = object({
  // subscribers: fun().array().optional(),
  tagFilter: string().optional(),
  test: object({
    timeout: number().optional(),
  }).optional(),
  cucumber: object({
    app: fun(),
    world: fun(),
  }).optional(),
  runner: object({
    name: string(),
    describe: fun().args(tuple([string(), fun()])),
    test: fun().args(tuple([string(), fun()])),
    beforeEach: fun(),
    beforeAll: fun(),
    afterEach: fun(),
    afterAll: fun(),
    timeoutFn: fun().optional(),
  }),
});

export type TestExecutorConfig = {
  tagFilter?: string;
  // subscribers?: (EventSubscriber | ProviderSubscriber)[];
  test?: {
    timeout?: number;
  };
  cucumber: {
    app: Class<App>;
    world: Class<World>;
  };
  runner: {
    name: string;
    describe: TestGroup;
    test: Test;
    beforeEach: HookWrapper;
    beforeAll: HookWrapper;
    afterEach: HookWrapper;
    afterAll: HookWrapper;
    timeoutFn?: TimeoutFunction;
  };
};
