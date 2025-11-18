import type { ScopeExecutionAdapter } from "@autometa/scopes";
import type { ScenarioExecution } from "@autometa/test-builder";
import {
  clearStepDocstring,
  clearStepTable,
  setStepDocstring,
  setStepTable,
} from "./runtime/step-data";
import { isScenarioPendingError } from "./pending";

export interface ScenarioRunContext<World> {
  readonly adapter: ScopeExecutionAdapter<World>;
}

export async function runScenarioExecution<World>(
  execution: ScenarioExecution<World>,
  context: ScenarioRunContext<World>
): Promise<void> {
  execution.reset();
  const world = await context.adapter.createWorld();
  const disposeWorld = createWorldDisposer(world);

  try {
    const { steps, gherkinSteps } = execution;
    for (let index = 0; index < steps.length; index++) {
      const step = steps[index];
      if (!step) {
        continue;
      }
      const gherkinStep = gherkinSteps[index];
      try {
        setStepTable(world, gherkinStep?.dataTable);
        setStepDocstring(world, gherkinStep?.docString?.content);
        await step.handler(world);
      } finally {
        clearStepTable(world);
        clearStepDocstring(world);
      }
    }
    execution.markPassed();
  } catch (error) {
    if (isScenarioPendingError(error)) {
      execution.markPending(error.reason);
      return;
    }
    execution.markFailed(error);
    throw error;
  } finally {
    await disposeWorld();
  }
}

interface DisposableLike {
  dispose(): void | Promise<void>;
}

function createWorldDisposer(world: unknown): () => Promise<void> {
  const disposers: Array<() => Promise<void>> = [];

  if (world && typeof world === "object") {
    const record = world as Record<string, unknown>;

    const app = record.app;
    if (isDisposable(app)) {
      disposers.push(async () => {
        await app.dispose();
      });
    }

    const container = (record.di ?? record.container) as unknown;
    if (isDisposable(container)) {
      disposers.push(async () => {
        await container.dispose();
      });
    }
  }

  return async () => {
    if (disposers.length === 0) {
      return;
    }

    const errors: unknown[] = [];
    for (const dispose of disposers) {
      try {
        await dispose();
      } catch (error) {
        errors.push(error);
      }
    }

    if (errors.length === 1) {
      throw errors[0];
    }

    if (errors.length > 1) {
      const summary = new Error(
        "Multiple errors occurred while disposing world resources"
      );
      Object.defineProperty(summary, "cause", {
        configurable: true,
        enumerable: false,
        value: errors,
      });
      throw summary;
    }
  };
}

function isDisposable(value: unknown): value is DisposableLike {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const dispose = candidate.dispose;
  return typeof dispose === "function";
}
