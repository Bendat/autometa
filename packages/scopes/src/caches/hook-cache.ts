import { AutomationError } from "@autometa/errors";
import { TeardownHook, AfterHook, SetupHook, BeforeHook, Hook } from "../hook";

export class HookCache {
  private beforeEach: BeforeHook[] = [];
  private beforeAll: SetupHook[] = [];
  private afterEach: AfterHook[] = [];
  private afterAll: TeardownHook[] = [];

  constructor(readonly parent?: HookCache) {}
  addHook = (hook: Hook) => {
    if (hook instanceof BeforeHook) {
      this.beforeEach.push(hook);
    } else if (hook instanceof SetupHook) {
      this.beforeAll.push(hook);
    } else if (hook instanceof AfterHook) {
      this.afterEach.push(hook);
    } else if (hook instanceof TeardownHook) {
      this.afterAll.push(hook);
    } else {
      throw new AutomationError("unrecognized hook " + hook);
    }
    return hook;
  };

  get before(): BeforeHook[] {
    // if (this.parent) {
    //   return [...this.parent.before, ...this.beforeEach];
    // }
    return [...this.beforeEach];
  }

  get setup() {
    return [...this.beforeAll];
  }

  get after(): AfterHook[] {

    return [...this.afterEach];
  }

  get teardown() {
    return [...this.afterAll];
  }
}
