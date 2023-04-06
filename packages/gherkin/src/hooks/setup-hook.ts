import { Hook } from "./hook";

export class SetupHook extends Hook {
  name = "Setup";

  constructor(
    readonly description: string | undefined,
    readonly action: (...args: unknown[]) => void | Promise<void>
  ) {
    super();
  }
}
