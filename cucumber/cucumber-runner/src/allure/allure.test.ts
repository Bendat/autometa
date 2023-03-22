import { EventEmitter } from "stream";
import { test } from "vitest";
class Emitter extends EventEmitter {}

const e = new Emitter();
e.on("foo", async () => {
  await new Promise((resole) => setTimeout(resole, 100));
});
test("bar", () => {
  e.emit("foo");
});
