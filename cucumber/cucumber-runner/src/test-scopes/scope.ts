import { HookCache } from "@gherkin/step-cache";
import { Hook } from "./hook";

export abstract class Scope {
  abstract synchronous: boolean;
  abstract idString: () => string;
  openChild: Scope | undefined;
  readonly closedScopes: Scope[] = [];
  readonly hooks = new HookCache();
  abstract readonly action: () => void;
  abstract canAttach<T extends Scope>(childScope: T): boolean;

  run = () => {
    const result = this.action() as unknown as void | Promise<void>;
    if (this.synchronous && result instanceof Promise) {
      throw new Error(`${this.constructor.name} cannot be run asynchronously or return a promise.`);
    }
  };

  attach<T extends Scope>(childScope: T): void {
    if (this.openChild) {
      this.openChild.attach(childScope);
      return;
    }
    this.openChild = childScope;
    childScope.run();
    this.closedScopes.push(this.openChild);
    this.openChild = undefined;
  }

  attachHook<T extends Hook>(hook: T): void {
    if (this.openChild) {
      return this.openChild.attachHook(hook);
    }
    this.hooks.addHook(hook);
  }

  toString = () => {
    return `[${this.constructor.name}(${this.idString()}) { [${this.openChild}], [${this.closedScopes}] }]`;
  };
}
