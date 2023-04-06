import { Hook } from "./hook";

export class BeforeHook extends Hook {
  name = "Before";
  constructor(
    readonly description: string | undefined,
    readonly action: (...args: unknown[]) => void | Promise<void>
  ) {
    super();
  }
}
