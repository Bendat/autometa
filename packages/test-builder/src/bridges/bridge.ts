import { App } from "@autometa/app";
import {
  Background,
  DataTable,
  Example,
  Examples,
  Feature,
  GherkinNode,
  Rule,
  Scenario,
  ScenarioOutline,
  Step,
} from "@autometa/gherkin";
import { BackgroundScope, GlobalScope } from "@autometa/scopes";
import {
  FeatureScope,
  RuleScope,
  ScenarioOutlineScope,
  ScenarioScope,
  Scope,
  StepScope,
} from "@autometa/scopes";

export abstract class GherkinCodeBridge {
  abstract data: { gherkin: GherkinNode; scope: Scope };
}
export class GlobalBridge extends GherkinCodeBridge {
  readonly data: { gherkin: GherkinNode; scope: GlobalScope };
  constructor(scope: GlobalScope) {
    super();
    const nullNode = class extends GherkinNode {
      keyword = "none";
    };
    this.data = {
      scope,
      gherkin: new nullNode(),
    };
  }
}
export class FeatureBridge extends GherkinCodeBridge {
  data: { gherkin: Feature; scope: FeatureScope };
  background: BackgroundBridge;
  scenarios: (ScenarioBridge | ScenarioOutlineBridge)[] = [];
  rules: RuleBridge[] = [];
  steps: StepBridge[] = [];

  accumulateTags() {
    const scenarioTags = this.scenarios.map((scenario) => scenario.accumulateTags()).flat();
    const ruleTags = this.rules.map((rule) => rule.accumulateTags()).flat();
    const allTags = [...this.data.gherkin.tags, ...scenarioTags, ...ruleTags];
    return [...new Set(allTags)];
  }
}
export class BackgroundBridge extends GherkinCodeBridge {
  data: { gherkin: Background; scope: BackgroundScope };
  steps: StepBridge[] = [];
}

export class RuleBridge extends GherkinCodeBridge {
  data: { gherkin: Rule; scope: RuleScope };
  background: BackgroundBridge;
  scenarios: (ScenarioBridge | ScenarioOutlineBridge)[] = [];
  steps: StepBridge[] = [];

  accumulateTags() {
    const scenarioTags = this.scenarios.map((scenario) => scenario.accumulateTags()).flat();
    const allTags = [...this.data.gherkin.tags, ...scenarioTags];
    return [...new Set(allTags)];
  }
}

export class ScenarioBridge extends GherkinCodeBridge {
  data: { gherkin: Scenario; scope: ScenarioScope };
  steps: StepBridge[] = [];
  report: {
    passed?: boolean;
    error?: Error;
  } = {};

  get title() {
    return this.data.scope.title(this.data.gherkin);
  }
  get tags() {
    return [...this.data.gherkin.tags];
  }

  accumulateTags() {
    return this.tags;
  }
}
export class ExampleBridge extends GherkinCodeBridge {
  data: { gherkin: Example; scope: ScenarioScope };
  steps: StepBridge[] = [];
  report: {
    passed?: boolean;
    error?: Error;
  } = {};
  get title() {
    return this.data.scope.title(this.data.gherkin);
  }
  get tags() {
    return [...this.data.gherkin.tags];
  }

  accumulateTags() {
    return this.tags;
  }
}
export class ScenarioOutlineBridge extends GherkinCodeBridge {
  data: { gherkin: ScenarioOutline; scope: ScenarioOutlineScope };
  examples: ExamplesBridge[] = [];
  steps: StepBridge[] = [];
  get title() {
    return this.data.scope.title(this.data.gherkin);
  }
  get tags() {
    return [...this.data.gherkin.tags];
  }

  accumulateTags() {
    const exampleTags = this.examples.map((example) => example.tags).flat();
    const allTags = [...this.data.gherkin.tags, ...exampleTags];
    return [...new Set(allTags)];
  }
}

export class ExamplesBridge extends GherkinCodeBridge {
  data: { gherkin: Examples; scope: ScenarioOutlineScope };
  scenarios: ScenarioBridge[] = [];
  steps: StepBridge[] = [];
  get title() {
    return this.data.scope.title(this.data.gherkin);
  }
  
  get tags() {
    return [...this.data.gherkin.tags];
  }

  accumulateTags() {
    const scenarioTags = this.scenarios.map((scenario) => scenario.accumulateTags()).flat();
    const allTags = [...this.data.gherkin.tags, ...scenarioTags];
    return [...new Set(allTags)];
  }
}

export class StepBridge extends GherkinCodeBridge {
  data: {
    gherkin: Step;
    scope: StepScope<string, DataTable | undefined>;
    args: undefined | ((app: App) => unknown[]);
  };

  get args() {
    return this.data.args;
  }

  get expressionText() {
    return this.data.scope.expression.source;
  }
}
