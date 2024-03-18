import { Background, GherkinNode } from "@autometa/gherkin";
import {
  FeatureBridge,
  RuleBridge,
  ScenarioBridge,
  ScenarioOutlineBridge,
} from ".";

function failed(bridge: FeatureBridge | RuleBridge | ScenarioOutlineBridge) {
  const accumulator: ScenarioBridge[] = [];
  if (bridge instanceof ScenarioOutlineBridge) {
    return failedOutline(bridge);
  }
  for (const scenario of bridge.scenarios) {
    if (scenario instanceof ScenarioOutlineBridge) {
      accumulator.push(...failedOutline(scenario));
    } else if (!scenario.report.passed && scenario.report.error !== undefined) {
      accumulator.push(scenario);
    }
  }
  if (bridge instanceof FeatureBridge) {
    accumulator.push(...failedRule(bridge));
  }
  return accumulator;
}

function failedOutline(bridge: ScenarioOutlineBridge) {
  const accumulator: ScenarioBridge[] = [];

  for (const example of bridge.examples) {
    for (const scenario of example.scenarios) {
      if (!scenario.report.passed) {
        accumulator.push(scenario);
      }
    }
  }
  return accumulator;
}

function failedRule(bridge: FeatureBridge) {
  const accumulator: ScenarioBridge[] = [];
  for (const rule of bridge.rules) {
    for (const scenario of rule.scenarios) {
      if (scenario instanceof ScenarioOutlineBridge) {
        accumulator.push(...failedOutline(scenario));
      } else if (!scenario.report.passed) {
        accumulator.push(scenario);
      }
    }
  }
  return accumulator;
}

function gherkinToTestNames(
  node: GherkinNode,
  path = "",
  accumulator: string[] = []
) {
  if (!("name" in node) || node instanceof Background) {
    return;
  }
  const title = `${node.keyword}: ${node.name}`;
  const fullPath = path ? `${path} ${title}` : title;
  accumulator.push(fullPath);
  if (!node.children) {
    return;
  }
  for (const child of node.children) {
    if (!("name" in child) || child instanceof Background) {
      continue;
    }
    gherkinToTestNames(child, fullPath, accumulator);
  }
  return accumulator;
}

export const Query = {
  find: {
    failed,
  },
  testNames: gherkinToTestNames,
};
