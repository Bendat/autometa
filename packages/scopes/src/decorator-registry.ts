import { createScopes } from "./create-scopes";
import type {
  CreateScopesOptions,
  DecoratorFeatureDescriptor,
  DecoratorHookDescriptor,
  DecoratorRuleDescriptor,
  DecoratorScenarioDescriptor,
  DecoratorStepDescriptor,
  HookDsl,
  HookType,
  ScopePlan,
  ScopeRegistrationOptions,
  ScopesDsl,
  StepDsl,
  StepKeyword,
} from "./types";

interface FeatureRecord<World> {
  readonly descriptor: DecoratorFeatureDescriptor;
  readonly hooks: DecoratorHookDescriptor<World>[];
  readonly scenarios: Map<unknown, ScenarioRecord<World>>;
  readonly rules: Map<unknown, RuleRecord<World>>;
}

interface RuleRecord<World> {
  readonly descriptor: DecoratorRuleDescriptor;
  readonly hooks: DecoratorHookDescriptor<World>[];
  readonly scenarios: Map<unknown, ScenarioRecord<World>>;
}

interface ScenarioRecord<World> {
  readonly descriptor: DecoratorScenarioDescriptor;
  readonly steps: DecoratorStepDescriptor<World>[];
  readonly hooks: DecoratorHookDescriptor<World>[];
}

type ScopeRecord<World> =
  | { readonly kind: "feature"; readonly record: FeatureRecord<World> }
  | { readonly kind: "rule"; readonly record: RuleRecord<World>; readonly featureToken: unknown }
  | { readonly kind: "scenario"; readonly record: ScenarioRecord<World>; readonly featureToken: unknown; readonly ruleToken?: unknown };

export class DecoratorScopeRegistry<World> {
  private readonly features = new Map<unknown, FeatureRecord<World>>();
  private readonly scopeByToken = new Map<unknown, ScopeRecord<World>>();

  registerFeature(token: unknown, descriptor: DecoratorFeatureDescriptor): void {
    if (this.features.has(token)) {
      throw new Error("Feature token already registered");
    }
    const record: FeatureRecord<World> = {
      descriptor,
      hooks: [],
      scenarios: new Map(),
      rules: new Map(),
    };
    this.features.set(token, record);
    this.scopeByToken.set(token, { kind: "feature", record });
  }

  registerRule(featureToken: unknown, token: unknown, descriptor: DecoratorRuleDescriptor): void {
    const feature = this.ensureFeature(featureToken);
    if (feature.rules.has(token)) {
      throw new Error("Rule token already registered for feature");
    }
    const record: RuleRecord<World> = {
      descriptor,
      hooks: [],
      scenarios: new Map(),
    };
    feature.rules.set(token, record);
    this.scopeByToken.set(token, { kind: "rule", record, featureToken });
  }

  registerScenario(
    token: unknown,
    descriptor: DecoratorScenarioDescriptor,
    context: { readonly feature: unknown; readonly rule?: unknown }
  ): void {
    const feature = this.ensureFeature(context.feature);
    const record: ScenarioRecord<World> = {
      descriptor,
      steps: [],
      hooks: [],
    };
    if (context.rule) {
      const rule = this.ensureRule(context.feature, context.rule);
      if (rule.scenarios.has(token)) {
        throw new Error("Scenario token already registered for rule");
      }
      rule.scenarios.set(token, record);
      this.scopeByToken.set(token, {
        kind: "scenario",
        record,
        featureToken: context.feature,
        ruleToken: context.rule,
      });
    } else {
      if (feature.scenarios.has(token)) {
        throw new Error("Scenario token already registered for feature");
      }
      feature.scenarios.set(token, record);
      this.scopeByToken.set(token, {
        kind: "scenario",
        record,
        featureToken: context.feature,
      });
    }
  }

  registerStep(scenarioToken: unknown, descriptor: DecoratorStepDescriptor<World>): void {
    const scope = this.scopeByToken.get(scenarioToken);
    if (!scope || scope.kind !== "scenario") {
      throw new Error("Step must be registered against a scenario token");
    }
    scope.record.steps.push(descriptor);
  }

  registerHook(scopeToken: unknown, descriptor: DecoratorHookDescriptor<World>): void {
    const scope = this.scopeByToken.get(scopeToken);
    if (!scope) {
      throw new Error("Hook token not registered");
    }
    scope.record.hooks.push(descriptor);
  }

  build(options: CreateScopesOptions<World> = {}): ScopePlan<World> {
    const scopes = createScopes<World>(options);
    const stepBuilders: Record<StepKeyword, StepDsl<World>> = {
      Given: scopes.given,
      When: scopes.when,
      Then: scopes.then,
      And: scopes.and,
      But: scopes.but,
    };

    const featureHookBuilders: Partial<Record<HookType, HookDsl<World>>> = {
      beforeFeature: scopes.beforeFeature,
      afterFeature: scopes.afterFeature,
    };

    const ruleHookBuilders: Partial<Record<HookType, HookDsl<World>>> = {
      beforeRule: scopes.beforeRule,
      afterRule: scopes.afterRule,
    };

    for (const feature of this.features.values()) {
      const featureInput = toScopeInput(feature.descriptor);
      scopes.feature(featureInput, () => {
        applyHooks(feature.hooks, featureHookBuilders, "feature");

        for (const scenario of feature.scenarios.values()) {
          registerScenario(scopes, scenario, stepBuilders);
        }

        for (const rule of feature.rules.values()) {
          const ruleInput = toScopeInput(rule.descriptor);
          scopes.rule(ruleInput, () => {
            applyHooks(rule.hooks, ruleHookBuilders, "rule");
            for (const scenario of rule.scenarios.values()) {
              registerScenario(scopes, scenario, stepBuilders);
            }
          });
        }
      });
    }

    return scopes.plan();
  }

  private ensureFeature(token: unknown): FeatureRecord<World> {
    const feature = this.features.get(token);
    if (!feature) {
      throw new Error("Feature token not registered");
    }
    return feature;
  }

  private ensureRule(featureToken: unknown, ruleToken: unknown): RuleRecord<World> {
    const feature = this.ensureFeature(featureToken);
    const rule = feature.rules.get(ruleToken);
    if (!rule) {
      throw new Error("Rule token not registered for feature");
    }
    return rule;
  }
}

function registerScenario<World>(
  scopes: ScopesDsl<World>,
  scenario: ScenarioRecord<World>,
  stepBuilders: Record<StepKeyword, StepDsl<World>>
): void {
  const scenarioInput = toScopeInput(omitKind(scenario.descriptor));
  const hookBuilders = createScenarioHookBuilders(scopes, scenario.descriptor.kind);
  const builder = scenario.descriptor.kind === "scenarioOutline" ? scopes.scenarioOutline : scopes.scenario;

  builder(scenarioInput, () => {
    applyHooks(scenario.hooks, hookBuilders, scenario.descriptor.kind);
    for (const step of scenario.steps) {
      const builderFn = stepBuilders[step.keyword];
      if (!builderFn) {
        throw new Error(`Unsupported step keyword: ${step.keyword}`);
      }
      builderFn(step.expression, step.handler, step.options);
    }
  });
}

type ScopeExtras = Partial<Omit<ScopeRegistrationOptions, "name">>;

function toScopeInput(
  descriptor: ScopeRegistrationOptions & { readonly name: string }
): string | ScopeRegistrationOptions {
  const {
    name: descriptorName,
    tags,
    description,
    timeout,
    mode,
    source,
    data,
    examples,
  } = descriptor as ScopeRegistrationOptions & { readonly examples?: ScopeRegistrationOptions["examples"] };
  if (!descriptorName) {
    throw new Error("Decorator descriptor missing required name");
  }
  const name = descriptorName;

  const extras: ScopeExtras = {
    ...(tags && tags.length > 0 ? { tags: [...tags] } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(timeout !== undefined
      ? { timeout: typeof timeout === "number" ? timeout : { ...timeout } }
      : {}),
    ...(mode !== undefined ? { mode } : {}),
    ...(source ? { source: { ...source } } : {}),
    ...(data ? { data: { ...data } } : {}),
    ...(examples && examples.length > 0
      ? {
          examples: examples.map((example) => ({
            ...example,
            ...(example.tags ? { tags: [...example.tags] } : {}),
            table: example.table.map((row) => [...row] as readonly string[]),
          })),
        }
      : {}),
  } satisfies ScopeExtras;

  if (Object.keys(extras).length === 0) {
    return name;
  }

  const scoped: ScopeRegistrationOptions = { name, ...extras };
  return scoped;
}

function omitKind(descriptor: DecoratorScenarioDescriptor): ScopeRegistrationOptions & { readonly name: string } {
  const { kind: _kind, ...rest } = descriptor;
  return rest;
}

function createScenarioHookBuilders<World>(
  scopes: ScopesDsl<World>,
  kind: DecoratorScenarioDescriptor["kind"]
): Partial<Record<HookType, HookDsl<World>>> {
  const base: Partial<Record<HookType, HookDsl<World>>> = {
    beforeStep: scopes.beforeStep,
    afterStep: scopes.afterStep,
  };
  if (kind === "scenario") {
    return {
      ...base,
      beforeScenario: scopes.beforeScenario,
      afterScenario: scopes.afterScenario,
    };
  }
  return {
    ...base,
    beforeScenarioOutline: scopes.beforeScenarioOutline,
    afterScenarioOutline: scopes.afterScenarioOutline,
  };
}

function applyHooks<World>(
  hooks: readonly DecoratorHookDescriptor<World>[],
  builders: Partial<Record<HookType, HookDsl<World>>>,
  scopeLabel: string
): void {
  for (const hook of hooks) {
    const builder = builders[hook.type];
    if (!builder) {
      throw new Error(`Hook type ${hook.type} cannot be registered on ${scopeLabel}`);
    }
    if (hook.description) {
      builder(hook.description, hook.handler, hook.options);
    } else {
      builder(hook.handler, hook.options);
    }
  }
}
