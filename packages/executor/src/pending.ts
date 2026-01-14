import type { StepHandler } from "@autometa/scopes";

const PENDING_SCENARIO_SYMBOL: unique symbol = Symbol("autometa:scenario:pending");

export class ScenarioPendingError extends Error {
  readonly reason?: string;
  readonly [PENDING_SCENARIO_SYMBOL] = true;

  constructor(reason?: string) {
    super(reason ? `Scenario pending: ${reason}` : "Scenario pending");
    this.name = "ScenarioPendingError";
    if (reason !== undefined && reason !== null) {
      const trimmed = String(reason).trim();
      if (trimmed.length > 0) {
        this.reason = trimmed;
      }
    }
  }
}

export function isScenarioPendingError(error: unknown): error is ScenarioPendingError {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { [PENDING_SCENARIO_SYMBOL]?: unknown })[PENDING_SCENARIO_SYMBOL] === true
  );
}

function createPendingError(reason?: string): ScenarioPendingError {
  return new ScenarioPendingError(reason);
}

/**
 * Returns a step handler that marks the parent scenario as pending when executed.
 */
export function Pending<World = unknown>(reason?: string): StepHandler<World> {
  return function pendingStepHandler(world: World, ..._args: unknown[]): never {
    void world;
    throw createPendingError(reason);
  };
}

/**
 * Alias of {@link Pending} for teams that prefer the terminology used by some runners.
 */
export const ToDo = Pending;

/**
 * Imperatively mark the current scenario as pending from within a step definition.
 *
 * @throws ScenarioPendingError to signal the executor that the scenario should be treated as pending.
 */
export function markScenarioPending(reason?: string): never {
  throw createPendingError(reason);
}
