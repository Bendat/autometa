import { AutomationError } from "@autometa/errors";
import {
  ExamplesBridge,
  FeatureBridge,
  GherkinCodeBridge,
  ScenarioBridge,
  ScenarioOutlineBridge,
  RuleBridge,
} from "./bridge";

export function find(
  bridge: FeatureBridge | RuleBridge | ScenarioOutlineBridge,
  testName: string
): GherkinCodeBridge | undefined {
  if (bridge instanceof FeatureBridge) {
    return findByFeature(bridge, testName);
  }
  if (bridge instanceof RuleBridge) {
    return findByRule(bridge, testName);
  }
  if (bridge instanceof ScenarioOutlineBridge) {
    return findScenarioOutlineOrChild(bridge, testName);
  }

  throw new AutomationError(`Could not find test matching ${testName}`);
}
function findByFeature(
  feature: FeatureBridge,
  testName: string
): GherkinCodeBridge | undefined {
  const title = feature.data.scope.title(feature.data.gherkin);
  const byScenario = findTestTypes(feature.scenarios, testName, title);
  if (byScenario) {
    return byScenario;
  }
  const byRule = findRuleTypes(feature.rules, testName, title);
  if (byRule) {
    return byRule;
  }
}
function findByRule(
  rule: RuleBridge,
  testName: string
): GherkinCodeBridge | undefined {
  const title = rule.data.scope.title(rule.data.gherkin);
  const byScenario = findTestTypes(rule.scenarios, testName, title);
  if (byScenario) {
    return byScenario;
  }
  const byRule = findRuleOrChild(rule, testName, title);
  if (byRule) {
    return byRule;
  }
}

export function findTestTypes(
  scenarios: (ScenarioBridge | ScenarioOutlineBridge | ExamplesBridge)[],
  testName: string,
  from?: string
) {
  for (const scenario of scenarios) {
    if (scenario instanceof ScenarioOutlineBridge) {
      const found = findScenarioOutlineOrChild(scenario, testName, from);
      if (found) {
        return found;
      }
    }
    if (scenario instanceof ExamplesBridge) {
      const found = findExamplesOrChild(scenario, testName, from);
      if (found) {
        return found;
      }
    }
    if (scenario instanceof ScenarioBridge) {
      const found = findScenario(scenario, testName, from);
      if (found) {
        return found;
      }
    }
  }
}

export function findRuleTypes(
  rules: RuleBridge[],
  testName: string,
  from?: string
) {
  for (const rule of rules) {
    const found = findRuleOrChild(rule, testName, from);
    if (found) {
      return found;
    }
  }
}

export function findRuleOrChild(
  rule: RuleBridge,
  testName: string,
  from?: string
) {
  const {
    data: { scope, gherkin },
  } = rule;
  const title = scope.title(gherkin);
  if (testName === title) {
    return rule;
  }
  if (from) {
    const fullTitle = `${from} ${title}`;
    if (fullTitle === testName) {
      return rule;
    }
  }
  const newFrom = appendPath(from, title);
  return findTestTypes(rule.scenarios, testName, newFrom);
}

export function findScenarioOutlineOrChild(
  outline: ScenarioOutlineBridge,
  testName: string,
  from?: string
) {
  const {
    data: { scope, gherkin },
  } = outline;
  const title = scope.title(gherkin);
  if (testName === title) {
    return outline;
  }
  if (from) {
    const fullTitle = `${from} ${title}`;
    if (fullTitle === testName) {
      return outline;
    }
  }
  for (const example of outline.examples) {
    const newFrom = appendPath(from, title);
    const found = findExamplesOrChild(example, testName, newFrom);
    if (found) {
      return found;
    }
  }
}

function appendPath(from: string | undefined, title: string) {
  return from ? `${from} ${title}` : title;
}

export function findExamplesOrChild(
  example: ExamplesBridge,
  testName: string,
  from?: string
) {
  const {
    data: { scope, gherkin },
  } = example;
  const title = scope.title(gherkin);
  if (testName === title) {
    return example;
  }
  if (from) {
    const fullTitle = `${from} ${title}`;
    if (fullTitle === testName) {
      return example;
    }
  }
  for (const scenario of example.scenarios) {
    const newFrom = appendPath(from, title);
    const found = findScenario(scenario, testName, newFrom);
    if (found) {
      return found;
    }
  }
}

export function findScenario(
  scenario: ScenarioBridge,
  testName: string,
  from?: string
) {
  const {
    data: { scope, gherkin },
  } = scenario;
  const title = scope.title(gherkin);
  if (testName === title) {
    return scenario;
  }
  if (from) {
    const fullTitle = `${from} ${title}`;
    if (fullTitle === testName) {
      return scenario;
    }
  }
}
