import { TestEventEmitter } from "@autometa/events";
import { CONFIG } from "./config";
export * from "@autometa/events";
import { GroupLogEvents } from "./event-logger";
import p from "path";
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
    const isLocal = isRelativePath(event) || isAbsolutePath(event);
    if (isLocal) {
      const uriRoot = process.cwd();
      const uri = p.join(uriRoot, event);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const listener = require(uri);
      emitter.load(listener);
      return emitter;
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const listener = require(event);
    emitter.load(listener);
    return emitter;
  }

  return emitter;
}

function isRelativePath(path: string) {
  return path.startsWith(".");
}

function isAbsolutePath(path: string) {
  return p.isAbsolute(path);
}
