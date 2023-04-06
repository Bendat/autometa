import { Hook } from "./hook";

export class AfterHook extends Hook {
  name = "After";

  constructor(
    readonly description: string | undefined,
    readonly action: (...args: unknown[]) => void | Promise<void>
  ) {
    super();
  }
}
