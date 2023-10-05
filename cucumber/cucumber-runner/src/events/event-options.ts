import { CucumberExpression, RegularExpression } from "@cucumber/cucumber-expressions";
import { type TableValue } from "../gherkin/datatables/table-value";
import { GherkinExamples } from "../gherkin/gherkin-examples";
import { type Modifiers } from "../gherkin/types";
import { Status } from "allure-js-commons";

export interface StartFeatureOpts {
  title: string;
  path: string;
  tags: string[];
  modifier?: string;
}

export interface EndFeatureOpts {
  title: string;
  status: Status;
  error?: Error;
}

export interface StartRuleOpts {
  title: string;
  tags: string[];
  modifier?: string;
}

export interface EndRuleOpts {
  title: string;
  status: Status;
  error?: Error;
}

export interface StartScenarioOutlineOpts {
  title: string;
  tags: string[];
  examples: GherkinExamples[];
  modifier?: string;
  uuid?: string;
}

export interface EndScenarioOutlineOpts {
  title: string;
  status: Status;
  error?: Error;
}
export interface StartScenarioOpts {
  title: string;
  tags: string[];
  args: unknown[];
  modifier?: string;
  examples?: { readonly key: string; readonly value: TableValue }[];
}

export interface EndScenarioOpts {
  title: string;
  status: Status;
  error?: Error;
}
export interface StartScenarioOpts {
  title: string;
  description: string;
  tags: string[];
  args: unknown[];
  uuid: string;
}

export interface EndScenarioOpts {
  title: string;
  status: Status;
  error?: Error;
  modifier?: Modifiers;
}
export interface StartStepOpts {
  keyword: string;
  text: string;
  args: unknown[];
}

export interface EndStepOpts {
  text: string;
  expression: CucumberExpression | RegularExpression;
  status: Status;
  error?: Error | unknown;
}
export interface StartBeforeOpts {
  description?: string;
  args?: unknown[];
}

export interface EndBeforeOpts {
  description?: string;
  status: Status;
  error?: Error;
}
export interface StartAfterOpts {
  description?: string;
  args?: unknown[];
}

export interface EndAfterOpts {
  description?: string;
  status: Status;
  error?: Error;
}
export interface StartSetupOpts {
  description?: string;
  args?: unknown[];
}

export interface EndSetupOpts {
  description?: string;
  status: Status;
  error?: Error;
}

export interface StartTeardownOpts {
  description?: string;
  args?: unknown[];
}

export interface EndTeardownOpts {
  description?: string;
  status: Status;
  error?: Error;
}
