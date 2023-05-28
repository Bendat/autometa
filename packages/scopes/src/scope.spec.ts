import { HookCache } from "./caches";
import { Scope } from "./scope";
import { describe, it, expect } from "vitest";
import { BeforeHook } from "./hook";
class TestScope extends Scope {
  canAttach<T extends Scope>(_childScope: T): boolean {
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
  describe("run", () => {
    it("should run the action if it exists", () => {
      const scope = new TestScope("scope", true, true, true, () => {
        scope.setAlt("skip", true);
      });
      scope.run();
      expect(scope.skip).toBe(true);
    });
    it("should not run the action if it doesn't exist", () => {
      const scope = new TestScope("scope", true, true, true);
      scope.run();
      expect(scope.skip).toBe(false);
    });
    it("should throw an error if the action is async", () => {
      const scope = new TestScope(
        "scope",
        false,
        true,
        true,
        async () => undefined
      );
      expect(() => scope.run()).toThrow(
        "TestScope cannot be run asynchronously or return a promise."
      );
    });
  });
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
    it("should not add a child to an unreceptive scope", () => {
      const grandchild = new TestScope("grandchild", true, true, true);
      let child: TestScope = {} as unknown as TestScope;
      const scope = new TestScope("scope", true, false, true, () => {
        child = new TestScope("child", true, false, true, () => {
          scope.attach(grandchild);
        });
        child.run();
        scope.attach(child);
      });
      scope.run();
      expect(child.closedScopes).not.toContain(grandchild);
      expect(scope.closedScopes).not.toContain(grandchild);
    });
  });
  describe("attachHook", () => {
    it("should throw an error if the step doesn't allow hooks", () => {
      const hook = new BeforeHook("", () => undefined);
      const sut = new TestScope("scope", true, false, false);
      expect(() => sut.attachHook(hook)).toThrow(
        `Cannot attach hooks to TestScope. Only 'Feature', 'Rule', 'ScenarioOutline' and global scopes can have hooks`
      );
    });
    it("should attach a new hook to the scope", () => {
      const hook = new BeforeHook("", () => undefined);
      const sut = new TestScope("scope", true, true, true);
      sut.attachHook(hook);
      expect(sut.hooks.before).toContain(hook);
    });
    it("should attach a new hook to the child scope", () => {
      const hook = new BeforeHook("", () => undefined);
      let child: TestScope = {} as unknown as TestScope;
      const sut = new TestScope("scope", true, true, true, () => {
        child = new TestScope("child", true, true, true, () => {
          sut.attachHook(hook);
        });
        sut.attach(child);
        child.run();
      });
      sut.run();
      expect(sut.hooks.before).toContain(hook);
    });
  });
});
