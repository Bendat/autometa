import { ParameterTypeRegistry } from "@cucumber/cucumber-expressions";
import { GlobalScope } from "./global-scope";
import { Scope } from "./scope";
import { Scopes } from "./scopes";

export function GetCucumberFunctions(registry: ParameterTypeRegistry) {
  const global = new GlobalScope(registry);
  return addAlternatives(global, global);
}

function addAlternatives(
  {
    Feature,
    Scenario,
    ScenarioOutline,
    Rule,
    Given,
    When,
    Then,
    Before,
    After,
    Teardown,
    Setup
  }: Omit<Scopes, 'Global'>,
  Global: GlobalScope
) {
  addGroupAlternatives(Feature);
  addGroupAlternatives(Scenario);
  addGroupAlternatives(ScenarioOutline);
  addGroupAlternatives(Rule);
  return {
    Feature,
    Scenario,
    ScenarioOutline,
    Rule,
    Given,
    When,
    Then,
    Before,
    After,
    Teardown,
    Setup,
    Global
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addGroupAlternatives<K extends Scope, T extends (...args: any) => K>(
  group: T
): asserts group is T & { skip: T; only: T } {
  configureSkipOption<K, T>(group, "skip");
  configureSkipOption<K, T>(group, "only");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function configureSkipOption<K extends Scope, T extends (...args: any) => K>(
  group: T,
  key: "skip" | "only"
) {
  const value = function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any
  ) {
    const scope = group(...args);
    scope.setAlt(key, true);
    return scope;
  };

  Object.defineProperty(group, key, {
    configurable: true,
    writable: true,
    value: value.bind(group)
  });
}
