import { CucumberExpression, RegularExpression } from "@cucumber/cucumber-expressions";
import { GherkinExamples } from "@gherkin/gherkin-examples";
import { StatusType } from "./test-status";

export interface StartFeatureOpts {
  title: string;
  path: string;
  tags: string[];
  modifier?: string;
}

export interface EndFeatureOpts {
  title: string;
  status: StatusType;
  errors?: (Error | string | unknown)[];
}

export interface StartRuleOpts {
  title: string;
  tags: string[];
  modifier?: string;
}

export interface EndRuleOpts {
  title: string;
  status: StatusType;
  errors?: (Error | string | unknown)[];
}

export interface StartScenarioOutlineOpts {
  title: string;
  tags: string[];
  examples: GherkinExamples[];
  modifier?: string;
}

export interface EndScenarioOutlineOpts {
  title: string;
  status: StatusType;
  errors?: (Error | string | unknown)[];
}
export interface StartScenarioOpts {
  title: string;
  tags: string[];
  args: unknown[];
  modifier?: string;
}

export interface EndScenarioOpts {
  title: string;
  status: StatusType;
  errors?: (Error | string | unknown)[];
}
export interface StartScenarioOpts {
  title: string;
  tags: string[];
  args: unknown[];
}

export interface EndScenarioOpts {
  title: string;
  status: StatusType;
  errors?: (Error | string | unknown)[];
}
export interface StartStepOpts {
  keyword: string;
  text: string;
  args: unknown[];
}

export interface EndStepOpts {
  text: CucumberExpression | RegularExpression;
  status: StatusType;
  errors?: (Error | string | unknown)[];
}
export interface StartBeforeOpts {
  description?: string;
  args?: unknown[];
}

export interface EndBeforeOpts {
  description?: string;
  status: StatusType;
  errors?: (Error | string | unknown)[];
}
export interface StartAfterOpts {
  description?: string;
  args?: unknown[];
}

export interface EndAfterOpts {
  description?: string;
  status: StatusType;
  errors?: (Error | string | unknown)[];
}
export interface StartSetupOpts {
  description?: string;
  args?: unknown[];
}

export interface EndSetupOpts {
  description?: string;
  status: StatusType;
  errors?: (Error | string | unknown)[];
}

export interface StartTeardownOpts {
  description?: string;
  args?: unknown[];
}

export interface EndTeardownOpts {
  description?: string;
  status: StatusType;
  errors?: (Error | string | unknown)[];
}
