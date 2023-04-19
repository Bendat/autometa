import { HookCache } from "./caches";
import { Scope } from "./scope";
import { describe, it, expect } from "vitest";
class TestScope extends Scope {
  canAttach<T extends Scope>(childScope: T): boolean {
    throw new Error("Method not implemented.");
  }
  get idString() {
    return this.name;
  }
  action: (() => void | Promise<void>) | undefined;
  constructor(
    readonly name: string,
    public canHandleAsync: boolean,
    readonly canAttachChild: boolean,
    private readonly _canAttachHook: boolean,
    action?: () => void
  ) {
    super(new HookCache());
    this.action = action;
  }
  get canAttachHook() {
    return this._canAttachHook;
  }

  attach<T extends Scope>(childScope: T): void {
    if (this.canAttachChild) {
      super.attach(childScope);
    }
  }
}

describe("Scope", () => {
  describe("attach", () => {
    it("should attach a child scope to the root scope", () => {
      const scope = new TestScope("scope", true, true, true);
      const child = new TestScope("child", true, true, true);
      scope.attach(child);
      expect(scope.closedScopes).toContain(child);
    });
    it("should attach a child scope to the open child scope", () => {
      const grandchild = new TestScope("grandchild", true, true, true);
      let child: TestScope = {} as unknown as TestScope;
      const scope = new TestScope("scope", true, true, true, () => {
        child = new TestScope("child", true, true, true, () => {
          scope.attach(grandchild);
        });
        scope.attach(child);
      });
      scope.run();
      expect(child.closedScopes).toContain(grandchild);
    });
    it("should throw an Error if the scope cannot attach scopes", () => {
      const grandchild = new TestScope("grandchild", true, true, true);
      let child: TestScope = {} as unknown as TestScope;
      const scope = new TestScope("scope", true, false, true, () => {
        child = new TestScope("child", true, false, true, () => {
          scope.attach(grandchild);
        });
        child.run()
        scope.attach(child);
      });
      scope.run();
      expect(child.closedScopes).not.toContain(grandchild);
      expect(scope.closedScopes).not.toContain(grandchild);
    });
  });
});
