import type {
  HookDefinition,
  HookType,
  ScopeExecutionAdapter,
  ScopeNode,
} from "@autometa/scopes";
import type { ScenarioExecution } from "@autometa/test-builder";

export interface ResolvedHook<World> {
  readonly hook: HookDefinition<World>;
  readonly scope: ScopeNode<World>;
}

export interface HookCollection<World> {
  readonly beforeFeature: ResolvedHook<World>[];
  readonly afterFeature: ResolvedHook<World>[];
  readonly beforeRule: ResolvedHook<World>[];
  readonly afterRule: ResolvedHook<World>[];
  readonly beforeScenario: ResolvedHook<World>[];
  readonly afterScenario: ResolvedHook<World>[];
  readonly beforeScenarioOutline: ResolvedHook<World>[];
  readonly afterScenarioOutline: ResolvedHook<World>[];
  readonly beforeStep: ResolvedHook<World>[];
  readonly afterStep: ResolvedHook<World>[];
}

const EMPTY_COLLECTION: HookCollection<unknown> = {
  beforeFeature: [],
  afterFeature: [],
  beforeRule: [],
  afterRule: [],
  beforeScenario: [],
  afterScenario: [],
  beforeScenarioOutline: [],
  afterScenarioOutline: [],
  beforeStep: [],
  afterStep: [],
};

export function collectScenarioHooks<World>(
  adapter: ScopeExecutionAdapter<World>,
  execution: ScenarioExecution<World>
): HookCollection<World> {
  const scopes = buildScopeChain(adapter, execution);
  if (scopes.length === 0) {
    return EMPTY_COLLECTION as HookCollection<World>;
  }

  const buckets: HookCollection<World> = {
    beforeFeature: [],
    afterFeature: [],
    beforeRule: [],
    afterRule: [],
    beforeScenario: [],
    afterScenario: [],
    beforeScenarioOutline: [],
    afterScenarioOutline: [],
    beforeStep: [],
    afterStep: [],
  };

  for (const scope of scopes) {
    for (const hook of scope.hooks) {
      addHookToBuckets(buckets, hook, scope);
    }
  }

  return buckets;
}

function buildScopeChain<World>(
  adapter: ScopeExecutionAdapter<World>,
  execution: ScenarioExecution<World>
): ScopeNode<World>[] {
  const chain: ScopeNode<World>[] = [adapter.plan.root];
  chain.push(...execution.ancestors);
  chain.push(execution.scope);
  return chain;
}

function addHookToBuckets<World>(
  buckets: HookCollection<World>,
  hook: HookDefinition<World>,
  scope: ScopeNode<World>
): void {
  const entry: ResolvedHook<World> = { hook, scope };
  switch (hook.type as HookType) {
    case "beforeFeature":
      buckets.beforeFeature.push(entry);
      break;
    case "afterFeature":
      buckets.afterFeature.push(entry);
      break;
    case "beforeRule":
      buckets.beforeRule.push(entry);
      break;
    case "afterRule":
      buckets.afterRule.push(entry);
      break;
    case "beforeScenario":
      buckets.beforeScenario.push(entry);
      break;
    case "afterScenario":
      buckets.afterScenario.push(entry);
      break;
    case "beforeScenarioOutline":
      buckets.beforeScenarioOutline.push(entry);
      break;
    case "afterScenarioOutline":
      buckets.afterScenarioOutline.push(entry);
      break;
    case "beforeStep":
      buckets.beforeStep.push(entry);
      break;
    case "afterStep":
      buckets.afterStep.push(entry);
      break;
    default:
      break;
  }
}
