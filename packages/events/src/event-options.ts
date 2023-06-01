import {
  CucumberExpression,
  Expression,
  RegularExpression,
} from "@cucumber/cucumber-expressions";
import { Examples } from "@autometa/gherkin";
import { StatusType, ModifierType } from "@autometa/types";
import { TableValue } from "@autometa/types";
export interface StartFeatureOpts {
  title: string;
  path: string;
  tags: string[] | Set<string>;
  modifier?: string;
}

export interface EndFeatureOpts {
  title: string;
  status: StatusType;
  error?: Error;
}

export interface StartRuleOpts {
  title: string;
  tags: string[];
  modifier?: string;
}

export interface EndRuleOpts {
  title: string;
  status: StatusType;
  error?: Error;
}

export interface StartScenarioOutlineOpts {
  title: string;
  tags: string[];
  examples: Examples;
  modifier?: string;
  uuid?: string;
}

export interface EndScenarioOutlineOpts {
  title: string;
  status: StatusType;
  error?: Error;
}
export interface StartScenarioOpts {
  title: string;
  tags: string[] | Set<string>;
  examples?: { readonly key: string; readonly value: TableValue }[];
}

export interface EndScenarioOpts {
  title: string;
  status: StatusType;
  skipped: boolean;
  error?: Error;
}


export interface StartStepOpts {
  keyword: string;
  text: string;
  expression: Expression; 
  args: unknown[];
}

export interface EndStepOpts {
  keyword: string;
  text: string
  expression: Expression; 
  status: StatusType;
  error?: Error | unknown;
}

export interface StartBeforeOpts {
  description?: string;
  tags?: string[] | Set<string>;
  args?: unknown[];
}

export interface EndBeforeOpts {
  description?: string;
  status: StatusType;
  error?: Error;
}
export interface StartAfterOpts {
  description?: string;
  tags?: string[] | Set<string>;
  args?: unknown[];
}

export interface EndAfterOpts {
  description?: string;
  status: StatusType;
  error?: Error;
}
export interface StartSetupOpts {
  description?: string;
  tags?: string[] | Set<string>;
  args?: unknown[];
}

export interface EndSetupOpts {
  description?: string;
  status: StatusType;
  tags?: string[] | Set<string>;
  error?: Error;
}

export interface StartTeardownOpts {
  description?: string;
  args?: unknown[];
}

export interface EndTeardownOpts {
  description?: string;
  status: StatusType;
  error?: Error;
}
