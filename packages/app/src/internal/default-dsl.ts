import { createRequire } from "module";
import type { StepDsl } from "../types";

const require = createRequire(import.meta.url);

export function loadDefaultDsl(): StepDsl | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cucumber = require("@cucumber/cucumber");
    const { Given, When, Then, And, But, Before, After, BeforeAll, AfterAll, defineParameterType } = cucumber;

    if (!Given || !When || !Then) {
      return undefined;
    }

    return {
      Given,
      When,
      Then,
      And: And ?? Given,
      But: But ?? Given,
      Before,
      After,
      BeforeAll,
      AfterAll,
      defineParameterType,
    } satisfies StepDsl;
  } catch {
    return undefined;
  }
}
