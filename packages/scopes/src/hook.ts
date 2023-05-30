import { HookAction } from "./types";

export abstract class Hook {
  abstract readonly name: string;
  abstract readonly description?: string;
  abstract readonly action: HookAction;
  constructor(readonly tagFilterExpression?: string) {}
}

export class BeforeHook extends Hook {
  name = "Before";
  constructor(
    readonly description: string | undefined,
    readonly action: HookAction,
    tagFilterExpression?: string
  ) {
    super(tagFilterExpression);
  }
}

export class AfterHook extends Hook {
  name = "After";

  constructor(
    readonly description: string | undefined,
    readonly action: HookAction,
    tagFilterExpression?: string
  ) {
    super(tagFilterExpression);
  }
}

export class SetupHook extends Hook {
  name = "Setup";

  constructor(
    readonly description: string | undefined,
    readonly action: HookAction,
    tagFilterExpression?: string
  ) {
    super(tagFilterExpression);
  }
}

export class TeardownHook extends Hook {
  name = "Teardown";

  constructor(
    readonly description: string | undefined,
    readonly action: HookAction,
    tagFilterExpression?: string
  ) {
    super(tagFilterExpression);
  }
}
