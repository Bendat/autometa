import { EventEmitter } from "stream";
import { test } from "@jest/globals";
class Emitter extends EventEmitter {}

const e = new Emitter();
e.on("foo", async () => {
  await new Promise((resole) => setTimeout(resole, 100));
  console.log("hi");
});
test.skip("bar", (done) => {
  e.emit("foo");
  done();
});
