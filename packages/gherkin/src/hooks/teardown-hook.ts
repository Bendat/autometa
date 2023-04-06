import { Hook } from "./hook";

export class TeardownHook extends Hook {
  name = "Teardowns";

  constructor(
    readonly description: string | undefined,
    readonly action: (...args: unknown[]) => void | Promise<void>
  ) {
    super();
  }
}
