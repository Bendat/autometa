import { Container, Scope } from "@autometa/injection";
import { AutomationError } from "@autometa/errors";
import type {
  HookCallback,
  DefinedWorld,
  OptionalWorld,
  ScopeKeyResolver,
  ScopeKeys,
  ScopePayload,
  StepRuntimeContext,
  WorldCtor,
  WorldHierarchy,
  WorldScope,
} from "../types";

interface ScopeState<T extends object, C> {
  readonly ctor: WorldCtor<T>;
  readonly container: Container;
  readonly key: string;
  instance: T;
  context: C;
}

type EnterHandlers<
  TScenario extends object,
  TFeature extends object | undefined,
  TRule extends object | undefined,
  TOutline extends object | undefined,
  Ctx
> = {
  [S in WorldScope]: Set<HookCallback<S, TScenario, TFeature, TRule, TOutline, Ctx>>;
};

type ExitHandlers<
  TScenario extends object,
  TFeature extends object | undefined,
  TRule extends object | undefined,
  TOutline extends object | undefined,
  Ctx
> = EnterHandlers<TScenario, TFeature, TRule, TOutline, Ctx>;

export interface ScopeManagerOptions<
  TScenario extends object,
  TFeature extends object | undefined,
  TRule extends object | undefined,
  TOutline extends object | undefined,
  Ctx = StepRuntimeContext
> {
  readonly scenario: WorldCtor<TScenario>;
  readonly feature?: WorldCtor<DefinedWorld<TFeature>>;
  readonly rule?: WorldCtor<DefinedWorld<TRule>>;
  readonly outline?: WorldCtor<DefinedWorld<TOutline>>;
  readonly keyResolver: ScopeKeyResolver<Ctx>;
}

export class ScopeManager<
  TScenario extends object,
  TFeature extends object | undefined,
  TRule extends object | undefined,
  TOutline extends object | undefined,
  Ctx = StepRuntimeContext
> {
  private readonly root = new Container();

  private feature: ScopeState<DefinedWorld<TFeature>, Ctx> | undefined;
  private rule: ScopeState<DefinedWorld<TRule>, Ctx> | undefined;
  private outline: ScopeState<DefinedWorld<TOutline>, Ctx> | undefined;
  private scenario: ScopeState<TScenario, Ctx> | undefined;

  private readonly enterHandlers: EnterHandlers<TScenario, TFeature, TRule, TOutline, Ctx> = {
    feature: new Set(),
    rule: new Set(),
    outline: new Set(),
    scenario: new Set(),
  } as EnterHandlers<TScenario, TFeature, TRule, TOutline, Ctx>;

  private readonly exitHandlers: ExitHandlers<TScenario, TFeature, TRule, TOutline, Ctx> = {
    feature: new Set(),
    rule: new Set(),
    outline: new Set(),
    scenario: new Set(),
  } as ExitHandlers<TScenario, TFeature, TRule, TOutline, Ctx>;

  constructor(private readonly options: ScopeManagerOptions<TScenario, TFeature, TRule, TOutline, Ctx>) {}

  getHierarchy(): WorldHierarchy<TScenario, OptionalWorld<TFeature>, OptionalWorld<TRule>, OptionalWorld<TOutline>> {
    if (!this.scenario) {
      throw new AutomationError("Scenario world has not been initialised yet.");
    }

    return {
      scenario: this.scenario.instance,
      feature: (this.feature?.instance ?? undefined) as OptionalWorld<TFeature>,
      rule: (this.rule?.instance ?? undefined) as OptionalWorld<TRule>,
      outline: (this.outline?.instance ?? undefined) as OptionalWorld<TOutline>,
    } satisfies WorldHierarchy<TScenario, OptionalWorld<TFeature>, OptionalWorld<TRule>, OptionalWorld<TOutline>>;
  }

  async startScenario(rawContext: Ctx | undefined, explicitKeys?: ScopeKeys): Promise<void> {
    const context = rawContext ?? ({} as Ctx);
    const keys = explicitKeys ?? this.resolveKeys(context);

    await this.ensureFeature(keys, context);
    await this.ensureRule(keys, context);
    await this.ensureOutline(keys, context);

    if (this.scenario) {
      await this.disposeScenario(false);
    }

    this.scenario = this.createScopeState(
      this.options.scenario,
      keys.scenario,
      this.parentContainerFor("scenario"),
      context
    );

    this.syncHierarchyReferences();
    await this.triggerEnter("scenario", context);
  }

  async finishScenario(context?: Ctx): Promise<void> {
    await this.disposeScenario(true, context);
  }

  async resetAll(context?: Ctx): Promise<void> {
    await this.disposeScenario(true, context);
    await this.disposeOutline(context);
    await this.disposeRule(context);
    await this.disposeFeature(context);
  }

  onEnter<Scope extends WorldScope>(
    scope: Scope,
    handler: HookCallback<Scope, TScenario, TFeature, TRule, TOutline, Ctx>
  ): void {
    (this.enterHandlers[scope] as Set<HookCallback<Scope, TScenario, TFeature, TRule, TOutline, Ctx>>).add(handler);
  }

  onExit<Scope extends WorldScope>(
    scope: Scope,
    handler: HookCallback<Scope, TScenario, TFeature, TRule, TOutline, Ctx>
  ): void {
    (this.exitHandlers[scope] as Set<HookCallback<Scope, TScenario, TFeature, TRule, TOutline, Ctx>>).add(handler);
  }

  resolveKeys(context: Ctx): ScopeKeys {
    const { keyResolver } = this.options;
    const result: ScopeKeys = {
      scenario: keyResolver.scenario(context),
    };

    const feature = keyResolver.feature?.(context);
    if (feature) {
      result.feature = feature;
    }

    const rule = keyResolver.rule?.(context);
    if (rule) {
      result.rule = rule;
    }

    const outline = keyResolver.outline?.(context);
    if (outline) {
      result.outline = outline;
    }

    if (!result.feature) {
      result.feature = "feature";
    }

    return result;
  }

  hasScenario(): boolean {
    return Boolean(this.scenario);
  }

  private parentContainerFor(scope: WorldScope): Container {
    switch (scope) {
      case "feature":
        return this.root;
      case "rule":
        return this.feature?.container ?? this.root;
      case "outline":
        return this.rule?.container ?? this.feature?.container ?? this.root;
      case "scenario":
      default:
        return this.outline?.container ?? this.rule?.container ?? this.feature?.container ?? this.root;
    }
  }

  private ensureFeature(keys: ScopeKeys, context: Ctx): Promise<void> | void {
    const featureCtor = this.options.feature;
    if (!featureCtor) {
      return;
    }

    if (this.feature && this.feature.key === keys.feature) {
      return;
    }

    return this.replaceFeature(featureCtor, keys.feature ?? "feature", context);
  }

  private async ensureRule(keys: ScopeKeys, context: Ctx): Promise<void> {
    const ruleCtor = this.options.rule;
    if (!ruleCtor) {
      return;
    }

    if (this.rule && this.rule.key === keys.rule) {
      return;
    }

    await this.disposeRule(context);

    if (!keys.rule) {
      return;
    }

    this.rule = this.createScopeState(
      ruleCtor,
      keys.rule,
      this.parentContainerFor("rule"),
      context
    );
    this.syncHierarchyReferences();
    await this.triggerEnter("rule", context);
  }

  private async ensureOutline(keys: ScopeKeys, context: Ctx): Promise<void> {
    const outlineCtor = this.options.outline;
    if (!outlineCtor) {
      return;
    }

    if (this.outline && this.outline.key === keys.outline) {
      return;
    }

    await this.disposeOutline(context);

    if (!keys.outline) {
      return;
    }

    this.outline = this.createScopeState(
      outlineCtor,
      keys.outline,
      this.parentContainerFor("outline"),
      context
    );
    this.syncHierarchyReferences();
    await this.triggerEnter("outline", context);
  }

  private async replaceFeature(
    ctor: WorldCtor<DefinedWorld<TFeature>>,
    key: string,
    context: Ctx
  ): Promise<void> {
    await this.disposeFeature(context);

    this.feature = this.createScopeState(ctor, key, this.parentContainerFor("feature"), context);
    this.syncHierarchyReferences();
    await this.triggerEnter("feature", context);
  }

  private createScopeState<T extends object>(
    ctor: WorldCtor<T>,
    key: string,
    parent: Container,
    context: Ctx
  ): ScopeState<T, Ctx> {
    const container = parent.createChild() as Container;
    container.registerClass(ctor, { scope: Scope.SINGLETON });
    const instance = container.resolve(ctor);
    return { ctor, key, container, instance, context } satisfies ScopeState<T, Ctx>;
  }

  private async disposeScenario(runHandlers: boolean, context?: Ctx): Promise<void> {
    if (!this.scenario) {
      return;
    }

    if (runHandlers) {
      await this.triggerExit("scenario", context ?? this.scenario.context);
    }

    await this.scenario.container.dispose();
    this.scenario = undefined;
  }

  private async disposeOutline(context?: Ctx): Promise<void> {
    if (!this.outline) {
      return;
    }

    await this.triggerExit("outline", context ?? this.outline.context);
    await this.outline.container.dispose();
    this.outline = undefined;
  }

  private async disposeRule(context?: Ctx): Promise<void> {
    if (!this.rule) {
      return;
    }

    await this.triggerExit("rule", context ?? this.rule.context);
    await this.rule.container.dispose();
    this.rule = undefined;
  }

  private async disposeFeature(context?: Ctx): Promise<void> {
    if (!this.feature) {
      return;
    }

    await this.triggerExit("feature", context ?? this.feature.context);
    await this.feature.container.dispose();
    this.feature = undefined;
  }

  private async triggerEnter(scope: WorldScope, context: Ctx): Promise<void> {
    const handlers = this.enterHandlers[scope];
    if (!handlers.size) {
      return;
    }

    const payload = this.createPayload(scope);
    for (const handler of handlers) {
      // eslint-disable-next-line no-await-in-loop
      await handler(payload as never, context);
    }
  }

  private async triggerExit(scope: WorldScope, context: Ctx): Promise<void> {
    const handlers = this.exitHandlers[scope];
    if (!handlers.size) {
      return;
    }

    const payload = this.createPayload(scope);
    for (const handler of handlers) {
      // eslint-disable-next-line no-await-in-loop
      await handler(payload as never, context);
    }
  }

  private createPayload(scope: WorldScope): ScopePayload<
    typeof scope,
    TScenario,
    OptionalWorld<TFeature>,
    OptionalWorld<TRule>,
    OptionalWorld<TOutline>
  > {
    switch (scope) {
      case "feature":
        if (!this.feature) {
          throw new AutomationError("Feature world has not been initialised.");
        }
        return { feature: this.feature.instance } as never;
      case "rule":
        if (!this.rule) {
          throw new AutomationError("Rule world has not been initialised.");
        }
        return {
          feature: (this.feature?.instance ?? undefined) as OptionalWorld<TFeature>,
          rule: this.rule.instance,
        } as never;
      case "outline":
        if (!this.outline) {
          throw new AutomationError("Outline world has not been initialised.");
        }
        return {
          feature: (this.feature?.instance ?? undefined) as OptionalWorld<TFeature>,
          rule: (this.rule?.instance ?? undefined) as OptionalWorld<TRule>,
          outline: this.outline.instance,
        } as never;
      case "scenario":
      default:
        if (!this.scenario) {
          throw new AutomationError("Scenario world has not been initialised.");
        }
        return {
          feature: (this.feature?.instance ?? undefined) as OptionalWorld<TFeature>,
          rule: (this.rule?.instance ?? undefined) as OptionalWorld<TRule>,
          outline: (this.outline?.instance ?? undefined) as OptionalWorld<TOutline>,
          scenario: this.scenario.instance,
        } as never;
    }
  }

  private syncHierarchyReferences(): void {
    if (this.rule?.instance && this.feature?.instance) {
      this.attachParent(this.rule.instance, "feature", this.feature.instance);
    }

    if (this.outline?.instance) {
      if (this.feature?.instance) {
        this.attachParent(this.outline.instance, "feature", this.feature.instance);
      }
      if (this.rule?.instance) {
        this.attachParent(this.outline.instance, "rule", this.rule.instance);
      }
    }

    if (this.scenario?.instance) {
      if (this.feature?.instance) {
        this.attachParent(this.scenario.instance, "feature", this.feature.instance);
      }
      if (this.rule?.instance) {
        this.attachParent(this.scenario.instance, "rule", this.rule.instance);
      }
      if (this.outline?.instance) {
        this.attachParent(this.scenario.instance, "outline", this.outline.instance);
      }
    }
  }

  private attachParent(target: object, property: string, value: object): void {
    if (property in target && Reflect.get(target, property) === value) {
      return;
    }

    Object.defineProperty(target, property, {
      value,
      enumerable: false,
      configurable: true,
      writable: false,
    });
  }
}
