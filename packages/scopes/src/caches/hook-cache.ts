import { AutomationError } from "@autometa/errors";
import {
  TeardownHook,
  AfterHook,
  SetupHook,
  BeforeHook,
  Hook,
  BeforeScenarioOutlineHook,
  AfterScenarioOutlineHook,
  BeforeRuleHook,
  AfterRuleHook,
  BeforeFeatureHook,
  BeforeStepHook,
  AfterFeatureHook,
  AfterStepHook,
  AfterExamplesHook,
} from "../hook";
import { BeforeExamplesHook } from "../hook";

export class HookCache {
  private beforeEach: BeforeHook[] = [];
  private beforeAll: SetupHook[] = [];
  private afterEach: AfterHook[] = [];
  private afterAll: TeardownHook[] = [];
  private beforeFeature: BeforeFeatureHook[] = [];
  private afterFeature: AfterFeatureHook[] = [];
  private beforeScenarioOutline: BeforeScenarioOutlineHook[] = [];
  private afterScenarioOutline: AfterScenarioOutlineHook[] = [];
  private beforeExamples: BeforeExamplesHook[] = [];
  private afterExamples: AfterExamplesHook[] = [];
  private beforeRule: BeforeRuleHook[] = [];
  private afterRule: AfterRuleHook[] = [];
  private beforeStep: BeforeStepHook[] = [];
  private afterStep: AfterStepHook[] = [];

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
    } else if (hook instanceof BeforeScenarioOutlineHook) {
      this.beforeScenarioOutline.push(hook);
    } else if (hook instanceof AfterScenarioOutlineHook) {
      this.afterScenarioOutline.push(hook);
    } else if (hook instanceof BeforeExamplesHook) {
      this.beforeExamples.push(hook);
    } else if (hook instanceof AfterExamplesHook) {
      this.afterExamples.push(hook);
    } else if (hook instanceof BeforeRuleHook) {
      this.beforeRule.push(hook);
    } else if (hook instanceof AfterRuleHook) {
      this.afterRule.push(hook);
    } else if (hook instanceof BeforeFeatureHook) {
      this.beforeFeature.push(hook);
    } else if (hook instanceof AfterFeatureHook) {
      this.afterFeature.push(hook);
    } else if (hook instanceof BeforeStepHook) {
      this.beforeStep.push(hook);
    } else if (hook instanceof AfterStepHook) {
      this.afterStep.push(hook);
    } else {
      throw new AutomationError("unrecognized hook " + hook);
    }
    return hook;
  };

  get before(): BeforeHook[] {
    return [...this.beforeEach].sort(sorter);
  }

  get setup() {
    return [...this.beforeAll].sort(sorter);
  }

  get after(): AfterHook[] {
    return [...this.afterEach].sort(sorter);
  }

  get teardown() {
    return [...this.afterAll].sort(sorter);
  }

  get beforeScenarioOutlineHooks(): BeforeScenarioOutlineHook[] {
    const ancestors = this.parent ? this.parent.beforeScenarioOutlineHooks : [];
    return [...ancestors, ...this.beforeScenarioOutline].sort(sorter);
  }

  get afterScenarioOutlineHooks(): AfterScenarioOutlineHook[] {
    const ancestors = this.parent ? this.parent.afterScenarioOutlineHooks : [];
    return [...ancestors, ...this.afterScenarioOutline].sort(sorter);
  }

  get beforeExamplesHooks(): BeforeExamplesHook[] {
    const ancestors = this.parent ? this.parent.beforeExamplesHooks : [];
    return [...ancestors, ...this.beforeExamples].sort(sorter);
  }

  get afterExamplesHooks(): AfterExamplesHook[] {
    const ancestors = this.parent ? this.parent.afterExamplesHooks : [];
    return [...ancestors, ...this.afterExamples].sort(sorter);
  }

  get beforeRuleHooks(): BeforeRuleHook[] {
    const ancestors = this.parent ? this.parent.beforeRuleHooks : [];
    return [...ancestors, ...this.beforeRule].sort(sorter);
  }

  get afterRuleHooks(): AfterRuleHook[] {
    const ancestors = this.parent ? this.parent.afterRuleHooks : [];
    return [...ancestors, ...this.afterRule].sort(sorter);
  }

  get beforeFeatureHooks(): BeforeFeatureHook[] {
    const ancestors = this.parent ? this.parent.beforeFeatureHooks : [];
    return [...ancestors, ...this.beforeFeature].sort(sorter);
  }

  get afterFeatureHooks(): AfterFeatureHook[] {
    const ancestors = this.parent ? this.parent.afterFeatureHooks : [];
    return [...ancestors, ...this.afterFeature].sort(sorter);
  }

  get beforeStepHooks(): BeforeStepHook[] {
    const ancestors = this.parent ? this.parent.beforeStepHooks : [];
    return [...ancestors, ...this.beforeStep].sort(sorter);
  }

  get afterStepHooks(): AfterStepHook[] {
    const ancestors = this.parent ? this.parent.afterStepHooks : [];
    return [...ancestors, ...this.afterStep].sort(sorter);
  }
}

function sorter(a: Hook, b: Hook) {
  return (a.options.order ?? 5) - (b.options.order ?? 5);
}
