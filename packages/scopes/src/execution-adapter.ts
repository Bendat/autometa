import type {
  ParameterRegistryLike,
  ScenarioSummary,
  ScopeExecutionAdapter,
  ScopeNode,
  ScopePlan,
  ScopeKind,
  WorldFactory,
} from "./types";

interface ExecutionAdapterOptions<World> {
  readonly worldFactory?: WorldFactory<World>;
  readonly parameterRegistry?: ParameterRegistryLike;
}

interface ParentMaps<World> {
  readonly parentById: Map<string, ScopeNode<World>>;
}

export function createExecutionAdapter<World>(
  plan: ScopePlan<World>,
  options: ExecutionAdapterOptions<World> = {}
): ScopeExecutionAdapter<World> {
  const maps = buildParentMaps(plan.root);
  const worldFactory = options.worldFactory ?? plan.worldFactory;
  const parameterRegistry = options.parameterRegistry ?? plan.parameterRegistry;

  return {
    plan,
    features: plan.root.children,
    async createWorld(scope, parentWorld) {
      if (!worldFactory) {
        throw new Error("No world factory configured for execution");
      }
      return worldFactory({ scope, ...(parentWorld !== undefined ? { parent: parentWorld } : {}) });
    },
    getScope(id) {
      return plan.scopesById.get(id);
    },
    getSteps(scopeId) {
      const scope = plan.scopesById.get(scopeId);
      return scope ? scope.steps : [];
    },
    getHooks(scopeId) {
      const scope = plan.scopesById.get(scopeId);
      return scope ? scope.hooks : [];
    },
    getAncestors(scopeId) {
      const ancestors: ScopeNode<World>[] = [];
      let current = maps.parentById.get(scopeId);
      while (current && current.kind !== "root") {
        ancestors.push(current);
        current = maps.parentById.get(current.id);
      }
      return ancestors.reverse();
    },
    listScenarios() {
      return collectScenarios(plan, maps.parentById);
    },
    getParameterRegistry() {
      return parameterRegistry;
    },
  };
}

function buildParentMaps<World>(root: ScopeNode<World>): ParentMaps<World> {
  const parentById = new Map<string, ScopeNode<World>>();

  const walk = (node: ScopeNode<World>, parent?: ScopeNode<World>) => {
    if (parent) {
      parentById.set(node.id, parent);
    }
    for (const child of node.children) {
      walk(child, node);
    }
  };

  walk(root);
  return { parentById };
}

function collectScenarios<World>(
  plan: ScopePlan<World>,
  parentById: Map<string, ScopeNode<World>>
): ScenarioSummary<World>[] {
  const summaries: ScenarioSummary<World>[] = [];

  const appendScenario = (scenario: ScopeNode<World>) => {
    const ancestors = gatherAncestors(scenario.id, parentById);
    const feature = ancestors.find((scope) => scope.kind === "feature");
    if (!feature) {
      throw new Error(`Scenario ${scenario.name} is missing a feature ancestor`);
    }
    const rule = ancestors.find((scope) => scope.kind === "rule");

    summaries.push({
      id: scenario.id,
      scenario,
      feature,
      ...(rule ? { rule } : {}),
      ancestors,
      steps: scenario.steps,
    });
  };

  const walk = (node: ScopeNode<World>) => {
    if (isScenarioKind(node.kind)) {
      appendScenario(node);
    }
    for (const child of node.children) {
      walk(child);
    }
  };

  walk(plan.root);
  return summaries;
}

function gatherAncestors<World>(
  scopeId: string,
  parentById: Map<string, ScopeNode<World>>
): ScopeNode<World>[] {
  const ancestors: ScopeNode<World>[] = [];
  let current = parentById.get(scopeId);
  while (current && current.kind !== "root") {
    ancestors.push(current);
    current = parentById.get(current.id);
  }
  return ancestors.reverse();
}

function isScenarioKind(kind: ScopeKind): boolean {
  return kind === "scenario" || kind === "scenarioOutline";
}