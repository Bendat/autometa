import { AutomationError } from "@autometa/errors";
import type {
  StepSuite,
  StepFactoryOptions,
  StepDsl,
  StepExpression,
  StepCallback,
  HookSuite,
  StepFlowBuilder,
} from "./types";
import type { WorldCtor, ScopeKeyResolver, StepRuntimeContext } from "./types";
import { ScopeManager } from "./internal/scope-manager";

interface FlowCreator {
  <
    TScenario extends object,
    TFeature extends object | undefined = undefined,
    TRule extends object | undefined = undefined,
    TOutline extends object | undefined = undefined,
    Ctx = StepRuntimeContext
  >(
    scenario: WorldCtor<TScenario>,
    options?: StepFactoryOptions<TFeature, TRule, TOutline, Ctx>
  ): StepFlowBuilder;
}

interface StepDefinitionsFactory {
  <
    TScenario extends object,
    TFeature extends object | undefined = undefined,
    TRule extends object | undefined = undefined,
    TOutline extends object | undefined = undefined,
    Ctx = StepRuntimeContext
  >(
    scenario: WorldCtor<TScenario>,
    options?: StepFactoryOptions<TFeature, TRule, TOutline, Ctx>
  ): StepSuite<TScenario, TFeature, TRule, TOutline, Ctx>;
  flow: FlowCreator;
}

function baseCreateStepDefinitions<
  TScenario extends object,
  TFeature extends object | undefined = undefined,
  TRule extends object | undefined = undefined,
  TOutline extends object | undefined = undefined,
  Ctx = StepRuntimeContext
>(
  scenarioCtor: WorldCtor<TScenario>,
  options: StepFactoryOptions<TFeature, TRule, TOutline, Ctx> = {}
): StepSuite<TScenario, TFeature, TRule, TOutline, Ctx> {
  const dsl = resolveDsl(options.dsl);
  const keyResolver = (options.keyResolver ?? defaultKeyResolver) as ScopeKeyResolver<Ctx>;

  const manager = new ScopeManager<TScenario, TFeature, TRule, TOutline, Ctx>({
    scenario: scenarioCtor,
    keyResolver,
    ...(options.feature ? { feature: options.feature } : {}),
    ...(options.rule ? { rule: options.rule } : {}),
    ...(options.outline ? { outline: options.outline } : {}),
  });

  if (Array.isArray(options.expressions) && dsl.defineParameterType) {
    for (const definition of options.expressions) {
      dsl.defineParameterType(definition);
    }
  }

  setupLifecycleHooks(dsl, manager);

  const given = wrapStepRegistrar("Given", dsl, dsl.Given, manager);
  const when = wrapStepRegistrar("When", dsl, dsl.When, manager);
  const then = wrapStepRegistrar("Then", dsl, dsl.Then, manager);
  const and = wrapStepRegistrar("And", dsl, dsl.And ?? dsl.Given, manager);
  const but = wrapStepRegistrar("But", dsl, dsl.But ?? dsl.Given, manager);

  const hooks: HookSuite<TScenario, TFeature, TRule, TOutline, Ctx> = {
    BeforeFeature(handler) {
      manager.onEnter("feature", handler);
    },
    AfterFeature(handler) {
      manager.onExit("feature", handler);
    },
    BeforeRule(handler) {
      manager.onEnter("rule", handler);
    },
    AfterRule(handler) {
      manager.onExit("rule", handler);
    },
    BeforeOutline(handler) {
      manager.onEnter("outline", handler);
    },
    AfterOutline(handler) {
      manager.onExit("outline", handler);
    },
    BeforeScenario(handler) {
      manager.onEnter("scenario", handler);
    },
    AfterScenario(handler) {
      manager.onExit("scenario", handler);
    },
  };

  const flow = createFlowBuilder({
    given,
    when,
    then,
    and,
    but,
  });

  return {
    Given: given,
    When: when,
    Then: then,
    And: and,
    But: but,
    hooks,
    flow,
  } satisfies StepSuite<TScenario, TFeature, TRule, TOutline, Ctx>;
}

export const createStepDefinitions: StepDefinitionsFactory = Object.assign(
  baseCreateStepDefinitions as StepDefinitionsFactory,
  {
    flow: ((scenarioCtor, options) =>
      baseCreateStepDefinitions(scenarioCtor as never, options as never).flow) as FlowCreator,
  }
);

function resolveDsl(dsl: StepDsl | undefined): StepDsl {
  if (!dsl) {
    throw new AutomationError(
      "Step-definition DSL is required. Pass an explicit dsl option when creating step definitions."
    );
  }

  return ensureRegistrars(dsl);
}

function ensureRegistrars(dsl: StepDsl): StepDsl {
  if (!dsl.Given || !dsl.When || !dsl.Then) {
    throw new AutomationError("Step DSL must provide Given, When, and Then registrars.");
  }
  return dsl;
}

function wrapStepRegistrar<
  TScenario extends object,
  TFeature extends object | undefined,
  TRule extends object | undefined,
  TOutline extends object | undefined,
  Ctx
>(
  keyword: string,
  dsl: StepDsl,
  registrar: StepDsl["Given"] | undefined,
  manager: ScopeManager<TScenario, TFeature, TRule, TOutline, Ctx>
) {
  if (!registrar) {
    return () => {
      throw new AutomationError(`Step DSL does not expose a registrar for ${keyword}.`);
    };
  }

  return (expression: StepExpression, handler: StepCallback) => {
    const wrapped = createStepWrapper(keyword, expression, handler, manager);
    registrar.call(dsl, expression, wrapped);
  };
}

function createStepWrapper<
  TScenario extends object,
  TFeature extends object | undefined,
  TRule extends object | undefined,
  TOutline extends object | undefined,
  Ctx
>(
  keyword: string,
  expression: StepExpression,
  handler: StepCallback,
  manager: ScopeManager<TScenario, TFeature, TRule, TOutline, Ctx>
) {
  return async function stepExecution(this: unknown, ...args: unknown[]) {
    if (!manager.hasScenario()) {
      const context = resolveRuntimeContext<Ctx>(undefined, this);
      const keys = manager.resolveKeys(context);
      await manager.startScenario(context, keys);
    }

    const { scenario } = manager.getHierarchy();

    try {
      if (expectsThis(handler)) {
        return await handler.apply(scenario, args);
      }

      return await handler(scenario, ...args);
    } catch (error) {
      throw wrapStepError(error, keyword, expression);
    }
  };
}

function expectsThis(handler: StepCallback): boolean {
  return Boolean((handler as { prototype?: unknown }).prototype);
}

function wrapStepError(error: unknown, keyword: string, expression: StepExpression): AutomationError {
  if (error instanceof AutomationError) {
    return error;
  }

  const baseMessage =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";
  const message = `Step failed for ${keyword} ${String(expression)}: ${baseMessage}`;

  return new AutomationError(message, {
    cause: error instanceof Error ? error : undefined,
  });
}

function resolveRuntimeContext<Ctx>(hookArg: unknown, worldValue: unknown): Ctx {
  if (hookArg && typeof hookArg === "object") {
    return hookArg as Ctx;
  }
  if (worldValue && typeof worldValue === "object") {
    return worldValue as Ctx;
  }
  return {} as Ctx;
}

function setupLifecycleHooks<
  TScenario extends object,
  TFeature extends object | undefined,
  TRule extends object | undefined,
  TOutline extends object | undefined,
  Ctx
>(dsl: StepDsl, manager: ScopeManager<TScenario, TFeature, TRule, TOutline, Ctx>): void {
  if (dsl.Before) {
    dsl.Before.call(dsl, async function beforeScenario(this: unknown, context: unknown) {
      const runtime = resolveRuntimeContext<Ctx>(context, this);
      await manager.startScenario(runtime);
    });
  }

  if (dsl.After) {
    dsl.After.call(dsl, async function afterScenario(this: unknown, context: unknown) {
      const runtime = resolveRuntimeContext<Ctx>(context, this);
      await manager.finishScenario(runtime);
    });
  }

  if (dsl.AfterAll) {
    dsl.AfterAll.call(dsl, async function afterAll(this: unknown) {
      const runtime = resolveRuntimeContext<Ctx>(undefined, this);
      await manager.resetAll(runtime);
    });
  }
}

function createFlowBuilder(registrars: {
  readonly given: (expression: StepExpression, handler: StepCallback) => void;
  readonly when: (expression: StepExpression, handler: StepCallback) => void;
  readonly then: (expression: StepExpression, handler: StepCallback) => void;
  readonly and: (expression: StepExpression, handler: StepCallback) => void;
  readonly but: (expression: StepExpression, handler: StepCallback) => void;
}): StepFlowBuilder {
  const builder: StepFlowBuilder = {
    given: (expression) => createFlowRunner(registrars.given, expression, () => builder),
    when: (expression) => createFlowRunner(registrars.when, expression, () => builder),
    then: (expression) => createFlowRunner(registrars.then, expression, () => builder),
    and: (expression) => createFlowRunner(registrars.and, expression, () => builder),
    but: (expression) => createFlowRunner(registrars.but, expression, () => builder),
  };

  return builder;
}

function createFlowRunner(
  registrar: (expression: StepExpression, handler: StepCallback) => void,
  expression: StepExpression,
  next: () => StepFlowBuilder
) {
  return {
    run(handler: StepCallback) {
      registrar(expression, handler);
      return next();
    },
  };
}

const nextScenarioId = createKeyFactory("scenario");

const defaultKeyResolver: ScopeKeyResolver<StepRuntimeContext> = {
  feature(context) {
    return context.gherkinDocument?.feature?.name ?? context.pickle?.uri ?? undefined;
  },
  rule(context) {
    const nodes = context.pickle?.astNodeIds;
    return Array.isArray(nodes) && nodes.length > 1 ? nodes[0] : undefined;
  },
  outline(context) {
    const nodes = context.pickle?.astNodeIds;
    if (Array.isArray(nodes) && nodes.length > 1) {
      return nodes.slice(1).join(":");
    }
    return undefined;
  },
  scenario(context) {
    return context.pickle?.id ?? context.pickle?.name ?? nextScenarioId();
  },
};

function createKeyFactory(prefix: string): () => string {
  let counter = 0;
  return () => `${prefix}-${++counter}`;
}
