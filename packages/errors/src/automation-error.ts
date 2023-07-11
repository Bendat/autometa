export class AutomationError extends Error {
  constructor(message: string, public opts: { cause?: Error } = {}) {
    super(message);
    this.name = "AutomationError";
  }
}
