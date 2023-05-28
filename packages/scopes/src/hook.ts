export abstract class Hook {
  abstract readonly name: string;
  abstract readonly description?: string;
  abstract readonly action: (...args: unknown[]) => void | Promise<void>;
}

export class BeforeHook extends Hook {
  name = "Before";
  constructor(readonly description: string | undefined, readonly action: (...args: unknown[]) => void | Promise<void>) {
    super();
  }
}
export class AfterHook extends Hook {
  name = "After";

  constructor(readonly description: string | undefined, readonly action: (...args: unknown[]) => void | Promise<void>) {
    super();
  }
}
export class SetupHook extends Hook {
  name = "Setup";

  constructor(readonly description: string | undefined, readonly action: (...args: unknown[]) => void | Promise<void>) {
    super();
  }
}
export class TeardownHook extends Hook {
  name = "Teardown";

  constructor(readonly description: string | undefined, readonly action: (...args: unknown[]) => void | Promise<void>) {
    super();
  }
}
