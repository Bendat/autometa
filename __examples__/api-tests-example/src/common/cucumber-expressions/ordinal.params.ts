import { defineParameterType } from "@autometa/runner";

defineParameterType({
  name: "ordinal",
  regexpPattern: /(\d+)(?:st|nd|rd|th)/,
  transform: (value: string) => parseInt(value, 10)
});
