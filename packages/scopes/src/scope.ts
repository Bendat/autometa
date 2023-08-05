import { Bind } from "@autometa/bind-decorator";
import { Hook } from "./hook";
import { HookCache } from "./caches/hook-cache";
import {
  boolean,
  fallback,
  instance,
  overloads,
  def
} from "@autometa/overloaded";
import { CachedStep, StepCache } from "./caches";
import { StepKeyword, StepType } from "@autometa/gherkin";

export abstract class Scope {
  abstract readonly action:
    | undefined
    | (() => void | Promise<void>)
    | ((...args: unknown[]) => void | Promise<void>);
  skip = false;
  only = false;
  canHandleAsync = false;
  steps: StepCache;
  openChild: Scope | undefined;
  readonly closedScopes: Scope[] = [];
  readonly hooks: HookCache;
  isBuilt = false;
  constructor(
    parentHookCache: HookCache,
    parentStepCache: StepCache | string,
    readonly parentBuildCache: () => unknown
  ) {
    this.hooks = new HookCache(parentHookCache);
    this.steps =
      parentStepCache instanceof StepCache
        ? new StepCache(this.toString(), parentStepCache)
        : new StepCache(parentStepCache);
  }

  abstract get idString(): string;
  protected get canAttachHook(): boolean {
    return true;
  }
  get [Symbol.toStringTag]() {
    const name = this.constructor.name.replace("Scope", "");
    return `${name}#${this.idString}`;
  }
  toString() {
    const name = this.constructor.name.replace("Scope", "");
    return `${name}#${this.idString}`;
  }
  get hookCache() {
    return this.openChild ? this.openChild.hooks : this.hooks;
  }
  get stepCache() {
    return this.buildStepCache();
  }
  get alts() {
    return {
      skip: this.skip,
      only: this.only
    };
  }

  @Bind
  buildStepCache() {
    if (this.isBuilt) {
      return this.steps;
    }
    const filtered = this.closedScopes
      .filter((it) => it.isStepScope)
      .map((it) => it as CachedStep);
    filtered.forEach(this.steps.add);
    this.isBuilt = true;
    this.parentBuildCache();
    return this.steps;
  }

  @Bind
  getStep(keywordType: StepType, keyword: string, text: StepKeyword) {
    return this.buildStepCache().find(keywordType, keyword, text);
  }

  @Bind
  run() {
    if (!(typeof this.action === "function")) {
      return;
    }
    const result = this.action() as unknown as void | Promise<void>;
    if (!this.canHandleAsync && result instanceof Promise) {
      throw new Error(
        `${this.constructor.name} cannot be run asynchronously or return a promise.`
      );
    }
  }

  get isStepScope() {
    return false;
  }

  setAlt(alt: "skip" | "only", value: boolean) {
    this[alt] = value;
  }

  attach<T extends Scope>(childScope: T): void {
    overloads(
      def`attachToChild`(
        "Attach incoming scopes to the currently open child scope",
        instance(Scope)
      ).matches((scope) => {
        scope.attach(childScope);
      }),
      fallback(
        "If there is no open child, assign the scope directly to this scope  and make it the new open scope",
        () => {
          this.openChild = childScope;
          childScope.run();
          this.closedScopes.push(this.openChild);
          this.openChild = undefined;
        }
      )
    ).use([this.openChild]);
  }

  attachHook<T extends Hook>(hook: T): void;
  attachHook<T extends Hook>(hook: T): void {
    const pattern = [this.canAttachHook, hook, this.openChild];
    return overloads(
      def`handleHooksNotAllowed`(
        "Throw an error if this Scope implementation can't add hooks, such as StepScope",
        boolean({ equals: false }),
        instance(Hook),
        instance(Scope, undefined, { optional: true })
      ).matches(() => {
        throw new Error(
          `Cannot attach hooks to ${this.constructor.name}. Only 'Feature', 'Rule', 'ScenarioOutline' and global scopes can have hooks`
        );
      }),
      def`attachToChildScope`(
        "If there is an open Child Scope available, attach the hook to that",
        boolean(),
        instance(Hook),
        instance(Scope)
      ).matches((_, hook, openChild) => openChild.attachHook(hook)),
      fallback(
        "When no open child is available, add the hook directly to this scope",
        () => this.hooks.addHook(hook)
      )
    ).use(pattern);
  }

  [Symbol.toPrimitive](): string {
    return this.toString();
  }
}
