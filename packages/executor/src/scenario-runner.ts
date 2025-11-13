import type { ScopeExecutionAdapter } from "@autometa/scopes";
import type { ScenarioExecution } from "@autometa/test-builder";

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
    for (const step of execution.steps) {
      await step.handler(world);
    }
    execution.markPassed();
  } catch (error) {
    execution.markFailed(error);
    throw error;
  }
}
