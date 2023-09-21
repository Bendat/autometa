import type { HookAction } from "./types";
import { App } from "@autometa/app";
import { isTagsMatch } from "@autometa/gherkin";
import { Builder } from "@autometa/dto-builder";
import { AutomationError, safe } from "@autometa/errors";
import { HookReport } from "./hook-report";
import { Timeout } from "./timeout";

const HookReportBuilder = Builder(HookReport);
export abstract class Hook {
  abstract readonly name: string;
  abstract readonly description?: string;
  abstract readonly action: HookAction;
  abstract get canFilter(): boolean;

  constructor(
    readonly timeout?: Timeout,
    readonly tagFilterExpression?: string
  ) {}

  canExecute(...tagExpressions: string[]): boolean {
    return (
      this.canFilter &&
      isTagsMatch(Array.from(tagExpressions), this.tagFilterExpression)
    );
  }

  async execute(app: App, ...tagExpressions: string[]) {
    const report = new HookReportBuilder()
      .name(this.name)
      .description(this.description);
    if (!this.canExecute(...tagExpressions)) {
      return report.status("SKIPPED").build();
    }
    const result = await safe(this.action, app);
    if (result instanceof Error) {
      const message = `${this.name}: ${this.description} failed to execute.`;
      const error = new AutomationError(message, { cause: result });
      report.error(error).status("FAILED");
    }

    return report.status("PASSED").build();
  }
}

export class BeforeHook extends Hook {
  readonly name = "Before";
  constructor(
    readonly description: string | undefined,
    readonly action: HookAction,
    timeout: Timeout,
    tagFilterExpression?: string
  ) {
    super(timeout, tagFilterExpression);
  }
  get canFilter(): boolean {
    return true;
  }
}

export class AfterHook extends Hook {
  readonly name = "After";
  constructor(
    readonly description: string | undefined,
    readonly action: HookAction,
    timeout?: Timeout,
    tagFilterExpression?: string
  ) {
    super(timeout, tagFilterExpression);
  }
  get canFilter(): boolean {
    return true;
  }
}

export class SetupHook extends Hook {
  readonly name = "Setup";
  constructor(
    readonly description: string | undefined,
    readonly action: HookAction,
    timeout: Timeout,
    tagFilterExpression?: string
  ) {
    super(timeout, tagFilterExpression);
  }
  get canFilter(): boolean {
    return false;
  }
}

export class TeardownHook extends Hook {
  readonly name = "Teardown";
  constructor(
    readonly description: string | undefined,
    readonly action: HookAction,
    timeout: Timeout,
    tagFilterExpression?: string
  ) {
    super(timeout, tagFilterExpression);
  }
  get canFilter(): boolean {
    return false;
  }
}
