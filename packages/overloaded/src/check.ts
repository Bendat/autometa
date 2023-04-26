import { boolean } from "./arguments/boolean-argument";
import { number } from "./arguments/number-argument";
import { shape } from "./arguments/shape-argument";
import { string } from "./arguments/string-argument";
import { overloads } from "./overloads";
import { params } from "./params";

function foo(a: string, b: [any, any]): string | number {
  return overloads(
    params(string({ equals: "hello" }), number({ max: 10, min: 1 })).matches(
      (a) => "done " + a
    ),
    params(instance(MyClass), number({ max: 20, min: 11 })).matches(
      (a) => "done " + a
    ),
    params(shape({ doThing: boolean() })).matches((opts) => 1)
  ).use(args);
}