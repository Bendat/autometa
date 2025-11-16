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
  }
}
