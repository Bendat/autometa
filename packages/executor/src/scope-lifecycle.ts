import type {
  HookType,
  ParameterRegistryLike,
  ScopeExecutionAdapter,
  ScopeKind,
  ScopeNode,
  StepDefinition,
} from "@autometa/scopes";
import type { SimpleStep } from "@autometa/gherkin";
import type { ScenarioExecution } from "@autometa/test-builder";

import { collectScenarioHooks, type HookCollection, type ResolvedHook } from "./hooks";
import type { ExecutorRuntime } from "./types";
import { WorldContext } from "./async-context";

const PERSISTENT_SCOPE_KINDS: ReadonlySet<ScopeKind> = new Set([
  "feature",
  "rule",
  "scenarioOutline",
]);

const BEFORE_HOOK_TYPES: Record<ScopeKind, HookType | undefined> = {
  root: undefined,
  feature: "beforeFeature",
  rule: "beforeRule",
  scenario: "beforeScenario",
  scenarioOutline: "beforeScenarioOutline",
};

const AFTER_HOOK_TYPES: Record<ScopeKind, HookType | undefined> = {
  root: undefined,
  feature: "afterFeature",
  rule: "afterRule",
  scenario: "afterScenario",
  scenarioOutline: "afterScenarioOutline",
};

interface ScopeState<World> {
  readonly scope: ScopeNode<World>;
  readonly world: World;
  readonly dispose: () => Promise<void>;
  beforeExecuted: boolean;
  afterExecuted: boolean;
}

export type StepStatus = "passed" | "failed" | "skipped";

export interface HookLifecycleTargetScopeMetadata {
  readonly id: string;
  readonly kind: ScopeKind;
  readonly name?: string;
}

type ScenarioLifecycleType = ScenarioExecution<unknown>["type"];

export interface HookLifecycleScenarioMetadata {
  readonly id: string;
  readonly name: string;
  readonly type: ScenarioLifecycleType;
  readonly tags: readonly string[];
  readonly qualifiedName: string;
}

export interface HookLifecycleStepMetadata {
  readonly index: number;
  readonly keyword?: string;
  readonly text?: string;
  readonly status?: StepStatus;
}

export interface HookLifecycleMetadata {
  readonly targetScope: HookLifecycleTargetScopeMetadata;
  readonly scenario?: HookLifecycleScenarioMetadata;
  readonly step?: HookLifecycleStepMetadata;
  readonly hook?: unknown;
  readonly [key: string]: unknown;
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export interface StepHookDetails<World> {
  readonly index: number;
  readonly definition?: StepDefinition<World>;
  readonly gherkin?: SimpleStep;
  readonly status?: StepStatus;
}

export interface StepHookInvocationOptions<World> {
  readonly direction?: HookDirection;
  readonly step?: StepHookDetails<World>;
  readonly metadata?: Record<string, unknown>;
}

export type HookInvoker<World> = (
  hooks: readonly ResolvedHook<World>[],
  options: StepHookInvocationOptions<World>
) => Promise<void>;

export interface HookLogPathSegment {
  readonly id: string;
  readonly kind: ScopeKind | "step";
  readonly name: string;
  readonly keyword?: string;
}

export interface HookLogStepDetails {
  readonly index: number;
  readonly keyword?: string;
  readonly text?: string;
  readonly status?: StepStatus;
}

export interface HookLogScenarioDetails {
  readonly id: string;
  readonly name: string;
  readonly fullName: string;
  readonly keyword?: string;
  readonly language?: string;
}

export type HookLogPhase = "before" | "after";

export interface HookLogEvent {
  readonly message: string;
  readonly hookId: string;
  readonly hookType: HookType;
  readonly hookDescription?: string;
  readonly phase: HookLogPhase;
  readonly path: readonly HookLogPathSegment[];
  readonly scenario?: HookLogScenarioDetails;
  readonly step?: HookLogStepDetails;
  readonly targetKeyword?: string;
  readonly language?: string;
}

export type HookLogListener = (event: HookLogEvent) => void;

export interface ScopeLifecycleOptions {
  readonly hookLogger?: HookLogListener;
  readonly featureLanguage?: string;
  readonly scopeKeywords?: ReadonlyMap<string, string>;
}

export interface ScenarioRunContext<World> {
  readonly world: World;
  readonly parameterRegistry: ParameterRegistryLike | undefined;
  readonly beforeStepHooks: readonly ResolvedHook<World>[];
  readonly afterStepHooks: readonly ResolvedHook<World>[];
  invokeHooks: HookInvoker<World>;
}

interface HookInvocationParams<World> {
  readonly world: World;
  readonly scope: ScopeNode<World>;
  readonly scenario?: ScenarioExecution<World>;
  readonly step?: StepHookDetails<World>;
  readonly direction?: HookDirection;
  readonly metadata?: Record<string, unknown>;
}

type HookDirection = "asc" | "desc";

export class ScopeLifecycle<World> {
  private readonly states = new Map<string, ScopeState<World>>();
  private readonly depthMap = new Map<string, number>();
  private readonly root: ScopeNode<World>;
  private readonly hookLogger?: HookLogListener;
  private readonly featureLanguage: string | undefined;
  private readonly scopeKeywords: ReadonlyMap<string, string>;

  constructor(
    private readonly adapter: ScopeExecutionAdapter<World>,
    options: ScopeLifecycleOptions = {}
  ) {
    this.root = adapter.plan.root;
    this.buildDepthMap(this.root, 0);
    if (options.hookLogger) {
      this.hookLogger = options.hookLogger;
    }
    this.featureLanguage = options.featureLanguage;
    this.scopeKeywords = options.scopeKeywords ?? new Map<string, string>();
  }

  configurePersistentScope(scope: ScopeNode<World>, runtime: ExecutorRuntime): void {
    if (!this.isPersistentScope(scope)) {
      return;
    }

    runtime.beforeAll(async () => {
      await this.ensureState(scope);
    });

    runtime.afterAll(async () => {
      await this.teardownState(scope);
    });
  }

  collectScenarioHooks(execution: ScenarioExecution<World>): HookCollection<World> {
    return collectScenarioHooks(this.adapter, execution);
  }

  async runScenario(
    execution: ScenarioExecution<World>,
    hooks: HookCollection<World>,
    runner: (world: World, context: ScenarioRunContext<World>) => Promise<void>
  ): Promise<void> {
    const parentWorld = await this.resolveParentWorldForScenario(execution);
    const world = await this.adapter.createWorld(execution.scope, parentWorld);
    const disposeWorld = createWorldDisposer(world);
    const invokeHooks = this.createHookInvoker(execution, world);

    const scenarioContext: ScenarioRunContext<World> = {
      world,
      parameterRegistry: this.adapter.getParameterRegistry(),
      beforeStepHooks: hooks.beforeStep,
      afterStepHooks: hooks.afterStep,
      invokeHooks,
    };

    const errors: unknown[] = [];
    try {
      await WorldContext.run(world, async () => {
        await this.invokeHooks(hooks.beforeScenario, {
          world,
          scope: execution.scope,
          scenario: execution,
          direction: "asc",
        });

        await runner(world, scenarioContext);
      });
    } catch (error) {
      errors.push(error);
    } finally {
      try {
        await this.invokeHooks(hooks.afterScenario, {
          world,
          scope: execution.scope,
          scenario: execution,
          direction: "desc",
          metadata: { result: execution.result },
        });
      } catch (error) {
        errors.push(error);
      }

      try {
        await disposeWorld();
      } catch (error) {
        errors.push(error);
      }
    }

    if (errors.length === 1) {
      throw toError(errors[0], "Scenario execution failed");
    }

    if (errors.length > 1) {
      throw combineErrors(errors, "Multiple errors occurred during scenario execution");
    }
  }

  private async ensureState(scope: ScopeNode<World>): Promise<ScopeState<World>> {
    let state = this.states.get(scope.id);
    if (state) {
      if (!state.beforeExecuted) {
        await this.runScopeHooks(scope, "before", state.world);
        state.beforeExecuted = true;
      }
      return state;
    }

    await this.ensureAncestorStates(scope);

    const parentWorld = await this.resolveParentWorld(scope);
    const world = await this.adapter.createWorld(scope, parentWorld);
    const dispose = createWorldDisposer(world);

    state = {
      scope,
      world,
      dispose,
      beforeExecuted: false,
      afterExecuted: false,
    } satisfies ScopeState<World>;

    this.states.set(scope.id, state);

    await this.runScopeHooks(scope, "before", world);
    state.beforeExecuted = true;

    return state;
  }

  private async teardownState(scope: ScopeNode<World>): Promise<void> {
    const state = this.states.get(scope.id);
    if (!state) {
      return;
    }

    if (!state.afterExecuted) {
      await this.runScopeHooks(scope, "after", state.world);
      state.afterExecuted = true;
    }

    await state.dispose();
    this.states.delete(scope.id);
  }

  private async ensureAncestorStates(scope: ScopeNode<World>): Promise<void> {
    const parent = this.getParentScope(scope);
    if (!parent) {
      return;
    }

    if (!this.isPersistentScope(parent)) {
      return;
    }

    await this.ensureState(parent);
  }

  private async resolveParentWorld(scope: ScopeNode<World>): Promise<World | undefined> {
    const parent = this.getParentScope(scope);
    if (!parent || !this.isPersistentScope(parent)) {
      return undefined;
    }

    const parentState = this.states.get(parent.id) ?? (await this.ensureState(parent));
    return parentState.world;
  }

  private async resolveParentWorldForScenario(
    execution: ScenarioExecution<World>
  ): Promise<World | undefined> {
    const scope = execution.scope;
    const ownState = this.states.get(scope.id);
    if (ownState) {
      return ownState.world;
    }

    const ancestors = this.adapter.getAncestors(scope.id);
    for (let index = ancestors.length - 1; index >= 0; index -= 1) {
      const candidate = ancestors[index];
      if (!candidate || !this.isPersistentScope(candidate)) {
        continue;
      }
      const state = this.states.get(candidate.id) ?? (await this.ensureState(candidate));
      if (state) {
        return state.world;
      }
    }
    return undefined;
  }

  private getParentScope(scope: ScopeNode<World>): ScopeNode<World> | undefined {
    const ancestors = this.adapter.getAncestors(scope.id);
    if (ancestors.length === 0) {
      return undefined;
    }
    return ancestors[ancestors.length - 1];
  }

  private isPersistentScope(scope: ScopeNode<World>): boolean {
    return PERSISTENT_SCOPE_KINDS.has(scope.kind);
  }

  private async runScopeHooks(
    scope: ScopeNode<World>,
    phase: "before" | "after",
    world: World
  ): Promise<void> {
    const hookType = phase === "before" ? BEFORE_HOOK_TYPES[scope.kind] : AFTER_HOOK_TYPES[scope.kind];
    if (!hookType) {
      return;
    }

    const hooks = this.collectHooksForScope(scope, hookType);
    if (!hooks.length) {
      return;
    }

    await this.invokeHooks(hooks, {
      world,
      scope,
      direction: phase === "before" ? "asc" : "desc",
    });
  }

  private createHookInvoker(
    execution: ScenarioExecution<World>,
    world: World
  ): HookInvoker<World> {
    return async (hooks, options) => {
      const params: HookInvocationParams<World> = {
        world,
        scope: execution.scope,
        scenario: execution,
        ...(options.direction ? { direction: options.direction } : {}),
        ...(options.step ? { step: options.step } : {}),
        ...(options.metadata ? { metadata: options.metadata } : {}),
      };

      await this.invokeHooks(hooks, params);
    };
  }

  private async invokeHooks(
    hooks: readonly ResolvedHook<World>[],
    params: HookInvocationParams<World>
  ): Promise<void> {
    if (hooks.length === 0) {
      return;
    }

    const sorted = this.sortHooks(hooks, params.direction ?? "asc");

    for (const entry of sorted) {
      const metadata = this.buildHookMetadata(entry, params);
      const log = this.createContextLogger(entry, params);
      const context = {
        world: params.world,
        scope: entry.scope,
        ...(metadata ? { metadata } : {}),
        ...(log ? { log } : {}),
      } as const;

      // eslint-disable-next-line no-await-in-loop
      await entry.hook.handler(context);
    }
  }

  private buildHookMetadata(
    entry: ResolvedHook<World>,
    params: HookInvocationParams<World>
  ): HookLifecycleMetadata | undefined {
    const metadata: Partial<Mutable<HookLifecycleMetadata>> & Record<string, unknown> = {};

    if (params.metadata) {
      Object.assign(metadata, params.metadata);
    }

    if (entry.hook.options.data !== undefined) {
      metadata.hook = entry.hook.options.data;
    }

    metadata.targetScope = {
      id: params.scope.id,
      kind: params.scope.kind,
      name: params.scope.name,
    } as HookLifecycleTargetScopeMetadata;

    if (params.scenario) {
      metadata.scenario = {
        id: params.scenario.id,
        name: params.scenario.name,
        type: params.scenario.type,
        tags: params.scenario.tags,
        qualifiedName: params.scenario.qualifiedName,
      } as HookLifecycleScenarioMetadata;
    }

    if (params.step) {
      const { step } = params;
      metadata.step = {
        index: step.index,
        status: step.status,
        keyword: step.gherkin?.keyword ?? step.definition?.keyword,
        text: step.gherkin?.text,
      } as HookLifecycleStepMetadata;
    }

    return Object.keys(metadata).length > 0 ? (metadata as HookLifecycleMetadata) : undefined;
  }

  private collectHooksForScope(
    scope: ScopeNode<World>,
    type: HookType
  ): ResolvedHook<World>[] {
    const chain = this.buildChain(scope);
    const collected: ResolvedHook<World>[] = [];

    for (const candidate of chain) {
      for (const hook of candidate.hooks) {
        if (hook.type === type) {
          collected.push({ hook, scope: candidate });
        }
      }
    }

    return collected;
  }

  private buildChain(scope: ScopeNode<World>): ScopeNode<World>[] {
    const ancestors = this.adapter.getAncestors(scope.id);
    return [this.root, ...ancestors, scope];
  }

  private createContextLogger(
    entry: ResolvedHook<World>,
    params: HookInvocationParams<World>
  ): ((message: string) => void) | undefined {
    if (!this.hookLogger) {
      return undefined;
    }

    const emit = this.hookLogger;
    return (rawMessage: string) => {
      if (rawMessage === undefined || rawMessage === null) {
        return;
      }
      const message = String(rawMessage);
      if (message.length === 0) {
        return;
      }
      try {
        emit(this.buildHookLogEvent(entry, params, message));
      } catch (error) {
        if (typeof console !== "undefined" && typeof console.error === "function") {
          console.error(error);
        }
      }
    };
  }

  private buildHookLogEvent(
    entry: ResolvedHook<World>,
    params: HookInvocationParams<World>,
    message: string
  ): HookLogEvent {
    const ancestors = this.adapter.getAncestors(params.scope.id);
    const path: HookLogPathSegment[] = ancestors.map((node) => this.toPathSegment(node));
    const targetSegment = this.toPathSegment(params.scope);
    path.push(targetSegment);

    const direction = params.direction ?? "asc";
    const phase: HookLogPhase = direction === "desc" ? "after" : "before";

    const scenarioIndex = this.findScenarioSegmentIndex(path);
    const scenarioDetails = this.buildScenarioDetails(path, scenarioIndex, params);

    const language = this.resolveLanguage(params, scenarioDetails);
    const targetKeyword = this.scopeKeywords.get(params.scope.id);

    if (params.step) {
      path.push(this.toStepSegment(params.scope, params.step));
    }

    return {
      message,
      hookId: entry.hook.id,
      hookType: entry.hook.type,
      ...(entry.hook.description ? { hookDescription: entry.hook.description } : {}),
      phase,
      path,
      ...(scenarioDetails ? { scenario: scenarioDetails } : {}),
      ...(params.step ? { step: this.toStepDetails(params.step) } : {}),
      ...(targetKeyword ? { targetKeyword } : {}),
      ...(language ? { language } : {}),
    };
  }

  private toPathSegment(scope: ScopeNode<World>): HookLogPathSegment {
    const keyword = this.scopeKeywords.get(scope.id);
    return {
      id: scope.id,
      kind: scope.kind,
      name: scope.name,
      ...(keyword ? { keyword } : {}),
    };
  }

  private toStepSegment(
    scope: ScopeNode<World>,
    step: StepHookDetails<World>
  ): HookLogPathSegment {
    const keyword = step.gherkin?.keyword ?? step.definition?.keyword;
    return {
      id: `${scope.id}:step:${step.index}`,
      kind: "step",
      name: this.describeStep(step),
      ...(keyword ? { keyword: keyword.trim() } : {}),
    };
  }

  private toStepDetails(step: StepHookDetails<World>): HookLogStepDetails {
    return {
      index: step.index,
      ...(step.gherkin?.keyword ? { keyword: step.gherkin.keyword } : {}),
      ...(step.gherkin?.text ? { text: step.gherkin.text } : {}),
      ...(step.status ? { status: step.status } : {}),
    };
  }

  private describeStep(step: StepHookDetails<World>): string {
    const keyword = step.gherkin?.keyword ?? step.definition?.keyword;
    const text = step.gherkin?.text ?? this.describeStepExpression(step.definition);

    if (keyword) {
      const trimmedKeyword = keyword.trim();
      if (text && text.length > 0) {
        const needsSpace = text.startsWith(" ");
        return `${trimmedKeyword}${needsSpace ? "" : " "}${text}`;
      }
      return trimmedKeyword;
    }

    if (text && text.length > 0) {
      return text;
    }

    return `Step #${step.index + 1}`;
  }

  private describeStepExpression(
    definition: StepDefinition<World> | undefined
  ): string | undefined {
    if (!definition) {
      return undefined;
    }

    const expression = definition.expression;
    if (typeof expression === "string") {
      return expression;
    }
    return expression.toString();
  }

  private findScenarioSegmentIndex(path: readonly HookLogPathSegment[]): number {
    for (let index = path.length - 1; index >= 0; index -= 1) {
      const segment = path[index];
      if (!segment) {
        continue;
      }
      if (segment.kind === "scenario") {
        return index;
      }
      if (segment.kind === "scenarioOutline") {
        return index;
      }
    }
    return -1;
  }

  private buildScenarioDetails(
    path: readonly HookLogPathSegment[],
    scenarioIndex: number,
    params: HookInvocationParams<World>
  ): HookLogScenarioDetails | undefined {
    if (scenarioIndex < 0) {
      return undefined;
    }

    const scenarioSegment = path[scenarioIndex];
    if (!scenarioSegment) {
      return undefined;
    }

    const segments = path.slice(0, scenarioIndex + 1).map((segment) => segment.name);
    const fullName = segments.join(" › ");

    const scenario = params.scenario;
    const keyword = scenario?.keyword ?? scenarioSegment.keyword;
    const language = scenario?.feature.feature.language ?? this.featureLanguage;
    if (scenario) {
      return {
        id: scenario.id,
        name: scenario.name,
        fullName,
        ...(keyword ? { keyword } : {}),
        ...(language ? { language } : {}),
      };
    }

    return {
      id: scenarioSegment.id,
      name: scenarioSegment.name,
      fullName,
      ...(keyword ? { keyword } : {}),
      ...(language ? { language } : {}),
    };
  }

  private resolveLanguage(
    params: HookInvocationParams<World>,
    scenarioDetails: HookLogScenarioDetails | undefined
  ): string | undefined {
    if (params.scenario) {
      const scenarioLanguage = params.scenario.feature.feature.language;
      if (scenarioLanguage) {
        return scenarioLanguage;
      }
    }

    if (scenarioDetails?.language) {
      return scenarioDetails.language;
    }

    return this.featureLanguage;
  }

  private sortHooks(
    hooks: readonly ResolvedHook<World>[],
    direction: HookDirection
  ): ResolvedHook<World>[] {
    return hooks
      .slice()
      .sort((a, b) => this.compareHooks(a, b, direction));
  }

  private compareHooks(
    a: ResolvedHook<World>,
    b: ResolvedHook<World>,
    direction: HookDirection
  ): number {
    const orderA = a.hook.options.order ?? 0;
    const orderB = b.hook.options.order ?? 0;
    if (orderA !== orderB) {
      return direction === "asc" ? orderA - orderB : orderB - orderA;
    }

    const depthA = this.depthMap.get(a.scope.id) ?? 0;
    const depthB = this.depthMap.get(b.scope.id) ?? 0;
    if (depthA !== depthB) {
      return direction === "asc" ? depthA - depthB : depthB - depthA;
    }

    return a.hook.id.localeCompare(b.hook.id);
  }

  private buildDepthMap(node: ScopeNode<World>, depth: number): void {
    this.depthMap.set(node.id, depth);
    for (const child of node.children) {
      this.buildDepthMap(child, depth + 1);
    }
  }
}

interface DisposableLike {
  dispose(): void | Promise<void>;
}

function normalizeError(value: unknown, fallbackMessage: string): Error {
  if (value instanceof Error) {
    return value;
  }
  const error = new Error(fallbackMessage);
  Object.defineProperty(error, "cause", {
    configurable: true,
    enumerable: false,
    writable: true,
    value,
  });
  return error;
}

function toError(value: unknown, fallbackMessage: string): Error {
  return normalizeError(value, fallbackMessage);
}

function combineErrors(values: readonly unknown[], message: string): Error {
  const normalized = values.map((value, index) =>
    normalizeError(value, `${message} (${index + 1})`)
  );
  const aggregate = new Error(message);
  Object.defineProperty(aggregate, "cause", {
    configurable: true,
    enumerable: false,
    writable: true,
    value: normalized,
  });
  return aggregate;
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
      throw toError(errors[0], "World disposal failed");
    }

    if (errors.length > 1) {
      throw combineErrors(errors, "Multiple errors occurred while disposing world resources");
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
