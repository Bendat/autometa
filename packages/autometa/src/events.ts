import { TestEventEmitter } from "@autometa/events";
import { CONFIG } from "./config";
export * from "@autometa/events";
import { GroupLogEvents } from "./event-logger";
export function makeTestEmitter(opts: { groupLogger: boolean }) {
  const events = CONFIG.current.events;
  const emitter = new TestEventEmitter();
  if (opts.groupLogger) {
    emitter.load(new GroupLogEvents());
  }
  if (!events) {
    return emitter;
  }
  for (const event of events) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const listener = require(event);
    emitter.load(listener);
  }

  return emitter;
}
