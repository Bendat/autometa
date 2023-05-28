import { Bind } from "@autometa/bind-decorator";
import { Hook } from "./hook";
import { HookCache } from "./caches/hook-cache";
import {
  boolean,
  fallback,
  instance,
  overloads,
  def,
} from "@autometa/overloaded";

export abstract class Scope {
  skip = false;
  only = false;
  abstract canHandleAsync: boolean;
  abstract get idString(): string;
  openChild: Scope | undefined;
  readonly closedScopes: Scope[] = [];
  abstract readonly action: undefined | (() => void | Promise<void>);
  abstract canAttach<T extends Scope>(childScope: T): boolean;
  protected get canAttachHook(): boolean {
    return true;
  }
  constructor(readonly hooks: HookCache) {}

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
  get alts() {
    return {
      skip: this.skip,
      only: this.only,
    };
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
        "If there is no open child, assign the scope directly to this and make it the new open scope",
        () => {
          this.openChild = childScope;
          childScope.run();
          this.closedScopes.push(this.openChild);
          this.openChild = undefined;
        }
      )
    ).use([this.openChild]);
  }

  attachHook<T extends Hook>(hook: T) {
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
      ).matches((_, hook, openChild) => {
        openChild.attachHook(hook);
      }),
      fallback(
        "When no open child is available, add the hook directly to this scope",
        () => {
          this.hooks.addHook(hook);
        }
      )
    ).use(pattern);
  }

  [Symbol.toPrimitive](): string {
    return this.toString();
  }

  get [Symbol.toStringTag]() {
    return `${this.constructor.name}#${this.idString}`;
  }
}
