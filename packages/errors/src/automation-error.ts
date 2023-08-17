export class AutomationError extends Error {
  constructor(message: string, public opts: { cause?: Error } = {}) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    super(message, opts);
    this.name = "AutomationError";
  }
}
