import { AutomationError } from "@autometa/errors";
import { StepKeyword } from "@autometa/gherkin";
import { StepType } from "@autometa/gherkin";
import {
  Scope,
  RuleScope,
  ScenarioScope,
  ScenarioOutlineScope,
  BackgroundScope,
} from "@autometa/scopes";
import { Empty_Function } from "@autometa/scopes";

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
          undefined,
          value.hooks,
          value.steps
        );
        value.attach(rule);
        return rule;
      }
      return found;
    },
    findScenario: (name: string) => {
      const found = value.closedScopes.find((child) => {
        return (
          child instanceof ScenarioScope &&
          child.name === name &&
          !(child instanceof ScenarioOutlineScope)
        );
      }) as ScenarioScope;
      if (!found) {
        const scenario = new ScenarioScope(
          name,
          Empty_Function,
          undefined,
          value.hooks,
          value.steps
        );
        value.attach(scenario);
        return scenario;
      }
      return found;
    },
    findBackground: ({ name }: { name?: string }): BackgroundScope => {
      const found = value.closedScopes.find((child) => {
        return child instanceof BackgroundScope;
      }) as BackgroundScope | undefined;
      if (found && found.name !== name) {
        throw new AutomationError(
          `Could not find background matching ${name} but found ${found?.name}`
        );
      }
      if (found) {
        return found;
      }

      const bgScope = new BackgroundScope(
        name,
        Empty_Function,
        value.hooks,
        value.steps
      );
      value.attach(bgScope);
      return bgScope;
    },
    findScenarioOutline: (name: string): ScenarioOutlineScope => {
      const found = value.closedScopes.find((child) => {
        return child instanceof ScenarioOutlineScope && child.name === name;
      }) as ScenarioOutlineScope | undefined;
      if (!found) {
        const scenarioOutline = new ScenarioOutlineScope(
          name,
          Empty_Function,
          undefined,
          value.hooks,
          value.steps
        );
        value.attach(scenarioOutline);
        return scenarioOutline;
      }
      return found;
    },
    findExample(name: string): ScenarioScope {
      const found = value.closedScopes.find((child) => {
        if (!(child instanceof ScenarioScope)) {
          return false;
        }
        return child.name === name;
      }) as ScenarioScope;
      if (!found) {
        const scenario = new ScenarioScope(
          name,
          Empty_Function,
          undefined,
          value.hooks,
          value.steps
        );
        value.attach(scenario);
        return scenario;
      }
      return found;
    },
    findStep: (keywordType: StepType, keyword: StepKeyword, name: string) => {
      return value.steps.find(keywordType, keyword, name);
    },
  };
}
