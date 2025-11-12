import { createId } from "./id";
import type {
  CreateScopesOptions,
  ExecutionMode,
  HookDefinition,
  HookOptions,
  HookType,
  NormalizedHookOptions,
  NormalizedStepOptions,
  ParameterRegistryLike,
  ScopeKind,
  ScopeMetadata,
  ScopeNode,
  ScopePlan,
  SourceRef,
  StepDefinition,
  StepExpression,
  StepKeyword,
  StepOptions,
  WorldFactory,
} from "./types";

const DEFAULT_MODE: ExecutionMode = "default";

function cloneArray<T>(value: readonly T[] | undefined): T[] {
  return value ? [...value] : [];
}

function resolveMode(mode: ExecutionMode | undefined, fallback: ExecutionMode): ExecutionMode {
  return mode ?? fallback;
}

function normalizeStepOptions(
  options: StepOptions | undefined,
  fallbackMode: ExecutionMode
): NormalizedStepOptions {
  return {
    tags: cloneArray(options?.tags),
    mode: options?.mode ?? fallbackMode,
    ...(options?.timeout !== undefined ? { timeout: options.timeout } : {}),
    ...(options?.data ? { data: { ...options.data } } : {}),
  };
}

function normalizeHookOptions(
  options: HookOptions | undefined,
  fallbackMode: ExecutionMode
): NormalizedHookOptions {
  return {
    tags: cloneArray(options?.tags),
    mode: options?.mode ?? fallbackMode,
    ...(options?.timeout !== undefined ? { timeout: options.timeout } : {}),
    ...(options?.order !== undefined ? { order: options.order } : {}),
    ...(options?.data ? { data: { ...options.data } } : {}),
  };
}

export class ScopeComposer<World> {
  private readonly root: ScopeNode<World>;
  private readonly stack: ScopeNode<World>[];
  private readonly steps = new Map<string, StepDefinition<World>>();
  private readonly hooks = new Map<string, HookDefinition<World>>();
  private readonly scopes = new Map<string, ScopeNode<World>>();
  private readonly defaultMode: ExecutionMode;
  private readonly worldFactory: WorldFactory<World> | undefined;
  private readonly parameterRegistry: ParameterRegistryLike | undefined;

  constructor(private readonly options: CreateScopesOptions<World> = {}) {
    this.defaultMode = options.defaultMode ?? DEFAULT_MODE;
    if (options.worldFactory) {
      this.worldFactory = options.worldFactory;
    }
    if (options.parameterRegistry) {
      this.parameterRegistry = options.parameterRegistry;
    }
    this.root = this.createNode("root", "global", {
      tags: [],
      mode: this.defaultMode,
    });
    this.stack = [this.root];
  }

  get plan(): ScopePlan<World> {
    return {
      root: this.root,
      stepsById: this.steps,
      hooksById: this.hooks,
      scopesById: this.scopes,
      ...(this.worldFactory ? { worldFactory: this.worldFactory } : {}),
      ...(this.parameterRegistry ? { parameterRegistry: this.parameterRegistry } : {}),
    };
  }

  get currentScope(): ScopeNode<World> {
    const scope = this.stack[this.stack.length - 1];
    if (!scope) {
      throw new Error("No active scope context");
    }
    return scope;
  }

  enterScope<T>(scope: ScopeNode<World>, action?: () => T): T | ScopeNode<World> {
    const parent = this.currentScope;
    parent.children.push(scope);
    this.stack.push(scope);
    try {
      if (action) {
        return action();
      }
      return scope;
    } finally {
      this.stack.pop();
    }
  }

  createScope(
    kind: ScopeKind,
    name: string,
    metadata: ScopeMetadata | undefined,
    action?: () => void,
    allowedParents?: readonly ScopeKind[]
  ): ScopeNode<World> {
    this.assertParentScope(kind, allowedParents);
    const scope = this.createNode(kind, name, metadata ?? {});
    this.enterScope(scope, action);
    return scope;
  }

  registerStep(
    keyword: StepKeyword,
    expression: StepExpression,
    handler: StepDefinition<World>["handler"],
    options?: StepOptions,
    source?: SourceRef
  ): StepDefinition<World> {
    const id = this.nextId("step");
    const definition: StepDefinition<World> = {
      id,
      keyword,
      expression,
      handler,
      options: normalizeStepOptions(options, this.defaultMode),
      ...(source ? { source } : {}),
    };
    const scope = this.currentScope;
    scope.steps.push(definition);
    this.steps.set(id, definition);
    return definition;
  }

  registerHook(
    type: HookType,
    handler: HookDefinition<World>["handler"],
    options?: HookOptions,
    description?: string,
    source?: SourceRef
  ): HookDefinition<World> {
    const id = this.nextId("hook");
    const definition: HookDefinition<World> = {
      id,
      type,
      handler,
      options: normalizeHookOptions(options, this.defaultMode),
      ...(description ? { description } : {}),
      ...(source ? { source } : {}),
    };
    const scope = this.currentScope;
    scope.hooks.push(definition);
    this.hooks.set(id, definition);
    return definition;
  }

  private createNode(
    kind: ScopeKind,
    name: string,
    metadata: ScopeMetadata
  ): ScopeNode<World> {
    const id = this.nextId(kind);
    const mode = resolveMode(metadata.mode, this.defaultMode);

    const node: ScopeNode<World> = {
      id,
      kind,
      name,
      mode,
      tags: cloneArray(metadata.tags),
      steps: [],
      hooks: [],
      children: [],
      ...(metadata.timeout !== undefined ? { timeout: metadata.timeout } : {}),
      ...(metadata.description ? { description: metadata.description } : {}),
      ...(metadata.source ? { source: { ...metadata.source } } : {}),
      ...(metadata.data ? { data: { ...metadata.data } } : {}),
      ...(metadata.examples
        ? {
            examples: metadata.examples.map((example) => ({
              ...example,
              ...(example.tags ? { tags: [...example.tags] } : {}),
              table: example.table.map((row) => [...row]),
            })),
          }
        : {}),
    };
    this.scopes.set(id, node);
    return node;
  }

  private assertParentScope(kind: ScopeKind, allowedParents?: readonly ScopeKind[]) {
    if (!allowedParents || allowedParents.length === 0) {
      return;
    }
    const parent = this.currentScope;
    if (allowedParents.includes(parent.kind)) {
      return;
    }
    const expected = allowedParents.join(", ");
    throw new Error(
      `Cannot register ${kind} within ${parent.kind}; expected parent to be one of: ${expected}`
    );
  }

  private nextId(prefix: string): string {
    if (this.options.idFactory) {
      return this.options.idFactory();
    }
    return createId(prefix);
  }
}
