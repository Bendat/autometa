import { TestEventEmitter } from "@autometa/events";
import { CONFIG } from "./config";
export * from "@autometa/events";

export function makeTestEmitter() {
  const events = CONFIG.current.events;
  const emitter = new TestEventEmitter();
  for (const event of events) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const listener = require(event);
    emitter.load(listener);
  }
  return emitter;
}
