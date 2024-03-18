import { defineParameterType } from "@autometa/runner";
import { Foo } from "./foo.class";

defineParameterType({
  name: "class:foo",
  regexpPattern: [/'([^']*)'/, /"([^"]*)"/],
  type: Foo,
});
