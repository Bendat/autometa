import EventEmitter from "events";
import { Cb } from "./test-event-emitter";

export class TestEmitter<TArgsStart = never, TArgsEnd = never> extends EventEmitter {
  constructor(readonly name: string) {
    super();
  }

  emitStart = (...args: TArgsStart[]) => {
    this.emit(`onStart${this.name}`, ...args);
  };

  onStart = (action?: (...args: unknown[]) => void) => {
    if (action) {
      this.on(`onStart${this.name}`, action);
    }
  };

  onEnd = (action?: (...args: unknown[]) => void) => {
    if (action) {
      this.on(`onEnd${this.name}`, action);
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
