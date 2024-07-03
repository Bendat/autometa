import { defineParameterType } from "@autometa/runner";
import { Foo } from "./foo.class";

defineParameterType(
  {
    name: "class:foo",
    regex: [/'([^']*)'/, /"([^"]*)"/],
    type: Foo,
  },
  {
    name: "world:modify",
    regex: [/'([^']*)'/, /"([^"]*)"/],
    transform: (value, app) => {
      app.world.expressionValue = value;
      console.error(value);
      console.error(app);
    },
  }
);
