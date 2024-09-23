import { Background, isTagsMatch, Scenario, Step } from "@autometa/gherkin";
import { Timeout } from "./timeout";
import {
  AfterGroupHookAction,
  HookAction,
  HookOptions,
  StepHookAction,
  TaggedHookOptions,
  TeardownHookAction,
  TimeoutUnit,
} from "./types";
import { App } from "@autometa/app";
import { safeAsync, AutomationError } from "@autometa/errors";
import { HookReport } from "./hook-report";
import { Builder } from "@autometa/dto-builder";
const HookReportBuilder = Builder(HookReport);

export abstract class Hook {
  abstract readonly name: string;
  abstract readonly description?: string;
  abstract readonly action:
    | HookAction
    | AfterGroupHookAction
    | StepHookAction
    | TeardownHookAction;
  options: HookOptions = {};

  timeout(num: number, timeunit: TimeoutUnit): this;
  timeout(ms: number): this;
  timeout(timeout: Timeout): this;
  timeout(count: number | Timeout, timeunit?: TimeoutUnit): this {
    if (count instanceof Timeout) {
      this.options.timeout = count;
      return this;
    }
    this.options.timeout = timeunit
      ? Timeout.from([count, timeunit])
      : Timeout.from(count);
    return this;
  }
  order(order: number): this {
    this.options.order = order;
    return this;
  }
}

export abstract class TaggedHook extends Hook {
  abstract readonly action: HookAction | AfterGroupHookAction;
  abstract get canFilter(): boolean;
  declare options: TaggedHookOptions;

  canExecute(...tagExpressions: string[]): boolean {
    if (typeof this.options.customFilter === "function") {
      return this.options.customFilter(tagExpressions, this.description);
    }
    if (!this.canFilter) {
      return true;
    }
    if (this.options.tagFilter === undefined) {
      return true;
    }
    if (!tagExpressions) {
      return true;
    }
    if (tagExpressions.length === 0 && !this.options.tagFilter) {
      return true;
    }
    return isTagsMatch(tagExpressions, this.options.tagFilter);
  }

  tagFilter(tagFilter: string): this {
    this.options.tagFilter = tagFilter;
    return this;
  }

  customFilter(filter: (tags: string[]) => boolean): this {
    this.options.customFilter = filter;
    return this;
  }
}

export abstract class AppHook extends TaggedHook {
  abstract readonly name: string;
  abstract readonly description?: string;
  abstract readonly action: HookAction;
  abstract get canFilter(): boolean;

  async execute(app: App, ...tags: string[]): Promise<HookReport> {
    const report = new HookReportBuilder()
      .name(this.name)
      .description(this.description);
    if (!this.canExecute(...tags)) {
      return report.status("SKIPPED").build();
    }
    const result = await safeAsync(this.action, app, tags);
    if (result instanceof Error) {
      const message = `${this.name}: ${this.description} failed to execute.`;
      const error = new AutomationError(message, { cause: result });
      return report.error(error).status("FAILED").build();
    }

    return report.status("PASSED").build();
  }
}

export abstract class AfterGroupHook extends TaggedHook {
  abstract readonly name: string;
  abstract readonly description?: string;
  abstract readonly action: AfterGroupHookAction;
  abstract get canFilter(): boolean;

  async execute(app: App, apps: App[], ...tags: string[]) {
    const report = new HookReportBuilder()
      .name(this.name)
      .description(this.description);
    if (!this.canExecute(...tags)) {
      return report.status("SKIPPED").build();
    }
    const result = await safeAsync(this.action, app, apps, tags);
    if (result instanceof Error) {
      const message = `${this.name}: ${this.description} failed to execute.`;
      const error = new AutomationError(message, { cause: result });
      return report.error(error).status("FAILED").build();
    }

    return report.status("PASSED").build();
  }
}

export class BeforeHook extends AppHook {
  readonly name = "Before";
  constructor(
    readonly description: string | undefined,
    readonly action: HookAction
  ) {
    super();
  }
  get canFilter(): boolean {
    return true;
  }
}

export class AfterHook extends AppHook {
  readonly name = "After";
  constructor(
    readonly description: string | undefined,
    readonly action: HookAction
  ) {
    super();
  }
  get canFilter(): boolean {
    return true;
  }
}

export class SetupHook extends AppHook {
  readonly name = "Setup";
  constructor(
    readonly description: string | undefined,
    readonly action: HookAction
  ) {
    super();
  }
  get canFilter(): boolean {
    return false;
  }
}

export class TeardownHook extends TaggedHook {
  readonly name = "Teardown";
  constructor(
    readonly description: string | undefined,
    readonly action: TeardownHookAction
  ) {
    super();
  }
  get canFilter(): boolean {
    return false;
  }

  async execute(app: App, tags: string[]) {
    const report = new HookReportBuilder()
      .name(this.name)
      .description(this.description);
    if (!this.canExecute(...tags)) {
      return report.status("SKIPPED").build();
    }
    const result = await safeAsync(this.action, app, tags);
    if (result instanceof Error) {
      const message = `${this.name}: ${this.description} failed to execute.`;
      const error = new AutomationError(message, { cause: result });
      return report.error(error).status("FAILED").build();
    }

    return report.status("PASSED").build();
  }
}

export class BeforeScenarioOutlineHook extends AppHook {
  readonly name = "Before Scenario Outline";
  constructor(
    readonly description: string | undefined,
    readonly action: HookAction
  ) {
    super();
  }
  get canFilter(): boolean {
    return true;
  }
}

export class AfterScenarioOutlineHook extends AfterGroupHook {
  readonly name = "After Scenario Outline";
  constructor(
    readonly description: string | undefined,
    readonly action: AfterGroupHookAction
  ) {
    super();
  }
  get canFilter(): boolean {
    return true;
  }
}

export class BeforeExamplesHook extends AppHook {
  readonly name = "Before Examples";
  constructor(
    readonly description: string | undefined,
    readonly action: HookAction
  ) {
    super();
  }
  get canFilter(): boolean {
    return true;
  }
}

export class AfterExamplesHook extends AfterGroupHook {
  readonly name = "After Examples";
  constructor(
    readonly description: string | undefined,
    readonly action: AfterGroupHookAction
  ) {
    super();
  }
  get canFilter(): boolean {
    return true;
  }
}

export class BeforeRuleHook extends AppHook {
  readonly name = "Before Rule";
  constructor(
    readonly description: string | undefined,
    readonly action: HookAction
  ) {
    super();
  }
  get canFilter(): boolean {
    return true;
  }
}

export class AfterRuleHook extends AfterGroupHook {
  readonly name = "After Rule";
  constructor(
    readonly description: string | undefined,
    readonly action: AfterGroupHookAction
  ) {
    super();
  }
  get canFilter(): boolean {
    return true;
  }
}

export class BeforeFeatureHook extends AppHook {
  readonly name = "Before Feature";
  constructor(
    readonly description: string | undefined,
    readonly action: HookAction
  ) {
    super();
  }
  get canFilter(): boolean {
    return true;
  }
}

export class AfterFeatureHook extends AfterGroupHook {
  readonly name = "After Feature";
  constructor(
    readonly description: string | undefined,
    readonly action: AfterGroupHookAction
  ) {
    super();
  }
  get canFilter(): boolean {
    return true;
  }
}

export abstract class StepHook extends Hook {
  abstract readonly action: StepHookAction;

  async execute(
    app: App,
    step: Step,
    background: Background | undefined,
    scenario: Scenario | undefined
  ): Promise<HookReport> {
    const report = new HookReportBuilder()
      .name(this.name)
      .description(this.description);
    const result = await safeAsync(this.action, app, {
      step,
      background,
      scenario,
    });
    if (result instanceof Error) {
      const message = `${this.name}: ${this.description} failed to execute.`;
      const error = new AutomationError(message, { cause: result });
      return report.error(error).status("FAILED").build();
    }

    return report.status("PASSED").build();
  }
}
export class BeforeStepHook extends Hook {
  readonly name = "Before Step";
  constructor(
    readonly description: string | undefined,
    readonly action: StepHookAction
  ) {
    super();
  }
  get canFilter(): boolean {
    return false;
  }
}

export class AfterStepHook extends Hook {
  readonly name = "After Step";
  constructor(
    readonly description: string | undefined,
    readonly action: StepHookAction
  ) {
    super();
  }
  get canFilter(): boolean {
    return false;
  }
}
