import EventEmitter from "events";
import { Cb } from "./test-event-emitter";
import { AutomationError } from "@autometa/errors";
export class TestEmitter<
  TArgsStart = never,
  TArgsEnd = never
> extends EventEmitter {
  constructor(readonly name: string) {
    super();
  }

  emitStart = (...args: TArgsStart[]) => {
    this.emit(`onStart${this.name}`, ...args);
  };

  onStart = (action?: (...args: unknown[]) => void) => {
    if (action) {
      this.on(`onStart${this.name}`, tryWrapper(this.name, action));
    }
  };

  onEnd = (action?: (...args: unknown[]) => void) => {
    if (action) {
      this.on(`onEnd${this.name}`, tryWrapper(this.name, action));
    }
  };

  emitEnd = (...args: TArgsEnd[]) => {
    this.emit(`onEnd${this.name}`, ...args);
  };

  load = (onStart?: Cb, onEnd?: Cb) => {
    this.onStart(onStart);
    this.onEnd(onEnd);
  };
}

function tryWrapper(name: string, action: (...args: unknown[]) => void) {
  return (...args: unknown[]) => {
    try {
      const result = action(...args);
      if ((result as unknown) instanceof Promise) {
        throw new AutomationError(
          `A Subscriber action cannot be async or return a promise. Executing ${name}`
        );
      }
    } catch (e) {
      console.error(
        `Event Subscriber ${name} threw an error ${(e as Error).message}`
      );
    }
  };
}
