import EventEmitter from "events";
import { Cb } from "./test-event-emitter";
export class TestEmitter<
  TArgsStart = never,
  TArgsEnd = never
> extends EventEmitter {
  private promises: Promise<unknown>[] = [];

  constructor(readonly name: string) {
    super();
  }

  emitStart = (...args: TArgsStart[]) => {
    this.emit(`onStart${this.name}`, ...args);
  };

  onStart = (action?: (...args: unknown[]) => void) => {
    if (action) {
      this.on(`onStart${this.name}`, this.collectPromises(this.name, action));
    }
  };

  onEnd = (action?: (...args: unknown[]) => void) => {
    if (action) {
      this.on(`onEnd${this.name}`, this.collectPromises(this.name, action));
    }
  };

  emitEnd = (...args: TArgsEnd[]) => {
    this.emit(`onEnd${this.name}`, ...args);
  };

  load = (onStart?: Cb, onEnd?: Cb) => {
    this.onStart(onStart);
    this.onEnd(onEnd);
  };
  
  collectPromises = (name: string, action: (...args: unknown[]) => unknown) => {
    return (...args: unknown[]) => {
      try {
        const result = action(...args);
        if (result instanceof Promise) {
          this.promises.push(result);
        }
      } catch (e) {
        console.error(`Event Subscriber ${name} threw an error ${(e as Error).message}`);
      }
    };
  };

  waitForPromises = async () => {
    const settled = await Promise.allSettled(this.promises);
    return settled.filter((it) => it.status === "rejected").length;
  };
}
