import { StepType, STEP_TYPE } from "@autometa/gherkin";
import { RuleScope } from "./rule-scope";
import { ScenarioScope } from "./scenario-scope";
import { Scope } from "./scope";
import { StepScope } from "./step-scope";
import { ScenarioOutlineScope } from "./scenario-outline-scope";
import { Empty_Function } from "./novelties";
import { DataTable } from "@autometa/gherkin";

export function scope(value: Scope) {
  return {
    findRule: (name: string) => {
      const found = value.closedScopes.find((child) => {
        return child instanceof RuleScope && child.name === name;
      }) as RuleScope | undefined;
      if (!found) {
        const rule = new RuleScope(
          name,
          Empty_Function,
          value.hooks,
          value.steps
        );
        value.attach(rule);
        return rule;
      }
      return found;
    },
    findScenario: (name: string, rule?: string) => {
      if (rule) {
        const ruleScope = scope(value).findRule(rule);
        if (ruleScope) {
          const found = scope(ruleScope).findScenario(name);
          if (!found) {
            const scenario = new ScenarioScope(
              name,
              Empty_Function,
              value.hooks,
              value.steps
            );
            value.attach(scenario);
            return scenario;
          }
        }
      }
      const found = value.closedScopes.find((child) => {
        return (
          child instanceof ScenarioScope &&
          child.name === name &&
          !(child instanceof ScenarioOutlineScope)
        );
      }) as ScenarioScope | undefined;
      if (!found) {
        const scenario = new ScenarioScope(
          name,
          Empty_Function,
          value.hooks,
          value.steps
        );
        value.attach(scenario);
        return scenario;
      }
      return found;
    },
    findScenarioOutline: (
      name: string,
      rule?: string
    ): ScenarioOutlineScope | undefined => {
      if (rule) {
        const ruleScope = scope(value).findRule(rule);
        if (ruleScope) {
          const found = scope(ruleScope).findScenarioOutline(name);
          if (found) {
            return found;
          }
        }
      }
      const found = value.closedScopes.find((child) => {
        return child instanceof ScenarioScope && child.name === name;
      }) as ScenarioOutlineScope | undefined;
      if (!found) {
        const scenarioOutline = new ScenarioOutlineScope(
          name,
          Empty_Function,
          value.hooks,
          value.steps
        );
        value.attach(scenarioOutline);
        return scenarioOutline;
      }
      return found;
    },
    findStep: (
      keywordType: StepType,
      name: string,
      {
        rule,
        scenario,
        outline,
      }: { rule?: string; scenario?: string; outline?: string } = {}
    ): StepScope<string, DataTable> => {
      if (rule) {
        const ruleScope = scope(value).findRule(rule);
        if (ruleScope) {
          if (!outline && !scenario) {
            return scope(ruleScope).findStep(keywordType, name, {
              scenario,
              outline,
            });
          }
        }
      }
      if (scenario) {
        const scenarioScope = scope(value).findScenario(scenario, rule);
        if (scenarioScope) {
          return scope(scenarioScope).findStep(keywordType, name);
        }
      }
      if (outline) {
        const outlineScope =  scope(value).findScenarioOutline(outline, rule);
        if (outlineScope) {
          return scope(outlineScope).findStep(keywordType, name);
        }
      }
      return value.closedScopes.find(stepFilter(keywordType, name)) as
        | StepScope<string, DataTable>;
    },
  };
}
function stepFilter(keyword: StepType, text: string) {
  return (step: Scope) => {
    return (
      step instanceof StepScope &&
      compareKeywords(step.keywordType, keyword) &&
      step.expression.match(text) !== null
    );
  };
}
function compareKeywords(
  scopeKeywordType: StepType,
  gherkinKeywordType: StepType
) {
  const wildcards: string[] = [STEP_TYPE.Conjunction, STEP_TYPE.Unknown];
  if (scopeKeywordType === gherkinKeywordType) {
    return true;
  }
  if (wildcards.includes(gherkinKeywordType)) {
    return true;
  }
  return false;
}
