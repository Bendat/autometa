import type { HookAction } from "./types";
import { App } from "@autometa/app";
import { isTagsMatch } from "@autometa/gherkin";
import { Builder, Property } from "@autometa/dto-builder";
import { captureError } from "./capture-error";
import { StatusType } from "@autometa/types";

class HookReport {
  @Property
  name: string;
  @Property
  description?: string;
  @Property
  status: StatusType;
  @Property
  error?: Error;
}
const HookReportBuilder = Builder(HookReport);
export abstract class Hook {
  abstract readonly name: string;
  abstract readonly description?: string;
  abstract readonly action: HookAction;
  abstract get canFilter(): boolean;

  constructor(readonly tagFilterExpression?: string) {}

  async execute(app: App, ...tagExpressions: string[]) {
    const report = new HookReportBuilder()
      .name(this.name)
      .description(this.description);
    if (
      this.canFilter &&
      !isTagsMatch(Array.from(tagExpressions), this.tagFilterExpression)
    ) {
      return report.status("SKIPPED").build();
    }
    const result = await captureError(this.action, app);
    if (result instanceof Error) {
      report.error(result).status("FAILED");
    }

    return report.status("PASSED").build();
  }
}

export class BeforeHook extends Hook {
  readonly name = "Before";
  constructor(
    readonly description: string | undefined,
    readonly action: HookAction,
    tagFilterExpression?: string
  ) {
    super(tagFilterExpression);
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
    tagFilterExpression?: string
  ) {
    super(tagFilterExpression);
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
    tagFilterExpression?: string
  ) {
    super(tagFilterExpression);
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
    tagFilterExpression?: string
  ) {
    super(tagFilterExpression);
  }
  get canFilter(): boolean {
    return false;
  }
}
