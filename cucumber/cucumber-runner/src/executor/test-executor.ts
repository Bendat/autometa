import { Config } from "@config/config-manager";
import parse from "@cucumber/tag-expressions";
import { CompiledDataTable, TableType } from "@gherkin/datatables/table-type";
import { Docstring } from "@gherkin/doc-string";
import { GherkinRule } from "@gherkin/gherkin-rule";
import { GherkinScenario } from "@gherkin/gherkin-scenario";
import { GherkinScenarioOutline } from "@gherkin/gherkin-scenario-outline";
import { StoredStep } from "@gherkin/step-cache";
import { TestFunctions } from "@gherkin/test-functions";
import { FrameworkTestCall, Modifiers, TestGroup } from "@gherkin/types";
import { events } from "@scopes/events";
import { AfterHook, BeforeHook, SetupHook, TeardownHook } from "@scopes/hook";
import { Class } from "@typing/class";
import { getApp } from "src/di/get-app";
import { DependencyInstanceProvider, ProviderSubscriber } from "src/events";
import { GherkinFeature } from "../gherkin/gherkin-feature";
import { OnFailure } from "./OnFailure";
import { Status } from "allure-js-commons";
import { ParsedDataTable } from "@gherkin/datatables/datatable";
import { globalScope } from "@scopes/globals";
export class TestExecutor {
  subscribers: ProviderSubscriber[];
  #instanceDependencies: DependencyInstanceProvider[];
  constructor(private feature: GherkinFeature) {
    const prototypes = Config.get<Class<ProviderSubscriber>[]>("subscribers");
    this.subscribers = prototypes?.map((it) => new it()) ?? [];
    this.subscribers?.forEach((it) => events.load(it));
    // throw new Error(JSON.stringify(this.subscribers, null, 2));
    this.#instanceDependencies = this.subscribers
      ?.filter((sub) => sub.fixtures)
      ?.flatMap<DependencyInstanceProvider>(
        (sub) => sub.fixtures.instances as DependencyInstanceProvider[]
      );
  }
  execute() {
    const { beforeAll, afterAll, describe } = Config.get<TestFunctions>("runner");

    const featureGroup = tagFilter(this.feature.tags, describe, this.feature.modifier);
    let failed = false;
    function failFeature() {
      failed = true;
    }

    beforeAll(async () => {
      events.feature.emitStart({ title, path, tags, modifier });
      const setup = [...globalScope.hooks?.setup, ...this.feature.hooks?.setup];
      await runSetupHooks(setup, events.setup, failFeature);
    });
    afterAll(async () => {
      const teardown = [...globalScope.hooks?.teardown, ...this.feature.hooks?.teardown];
      await runTeardownHooks(teardown, failFeature);
    });
    afterAll(() => {
      events.feature.emitEnd({ title, status: failed ? Status.FAILED : Status.PASSED });
    });
    const { title, path, tags, modifier } = this.feature;
    featureGroup(`Feature ${title}`, () => {
      for (const child of this.feature.childer) {
        if (child instanceof GherkinRule) {
          this.runRule(child, failFeature);
        }
        if (child instanceof GherkinScenarioOutline) {
          this.runOutline(child, failFeature);
        }

        if (child instanceof GherkinScenario) {
          this.runScenario(
            child,
            this.feature.hooks?.before,
            this.feature?.hooks.after,
            failFeature
          );
        }
      }
    });
  }

  private runRule(rule: GherkinRule, onFailure: OnFailure) {
    const { beforeAll, afterAll, describe } = Config.get<TestFunctions>("runner");

    const ruleGroup = tagFilter(rule.tags, describe, rule.modifier);
    ruleGroup(`Rule ${rule.message.rule.name}`, () => {
      const { title, modifier, tags } = rule;
      const hooks = rule.hooks ?? globalScope.hooks;
      let failed = false;
      function failRule() {
        failed = true;
        onFailure();
      }
      beforeAll(async () => {
        events.rule.emitStart({ title, modifier, tags });
        await runSetupHooks(rule.hooks?.setup, events.setup, failRule);
      });

      afterAll(async () => {
        await runTeardownHooks(this.feature.hooks?.teardown, onFailure);

        events.rule.emitEnd({ title, status: failed ? Status.FAILED : Status.PASSED });
      });
      for (const ruleChild of rule.childer) {
        if (ruleChild instanceof GherkinScenarioOutline) {
          this.runOutline(ruleChild, failRule);
        }

        if (ruleChild instanceof GherkinScenario) {
          this.runScenario(ruleChild, hooks?.before, hooks?.after, failRule);
        }
      }
    });
  }

  private runOutline(outline: GherkinScenarioOutline, onFailure: OnFailure) {
    const { beforeAll, afterAll, describe } = Config.get<TestFunctions>("runner");
    const outlineGroup = tagFilter(outline.tags, describe, outline.modifier);
    outlineGroup(`Scenario Outline: ${outline.message.scenario.name}`, () => {
      const { title, tags, modifier, examples } = outline;
      const hooks = outline.hooks ?? globalScope.hooks;

      let failed = false;
      function failOutline() {
        failed = true;
        onFailure();
      }
      beforeAll(async () => {
        events.scenarioOutline.emitStart({ title, tags, modifier, examples });
        await runSetupHooks(hooks?.setup, events.setup, failOutline);
      });

      afterAll(async () => {
        await runTeardownHooks(outline.hooks?.teardown, onFailure);
        events.scenarioOutline.emitEnd({ title, status: failed ? Status.FAILED : Status.PASSED });
      });
      const scenarios = outline.scenarios;
      for (const scenario of scenarios) {
        this.runScenario(scenario, hooks?.before, hooks?.after, failOutline);
      }
    });
  }

  private runScenario(
    scenario: GherkinScenario,
    befores: BeforeHook[],
    afters: AfterHook[],
    onFailure: OnFailure
  ) {
    const { test } = Config.get<TestFunctions>("runner");
    const { title, tags, modifier, id, description, example: examples } = scenario;
    //  new Error(JSON.stringify(this.#instanceDependencies, null, 2));
    const app = getApp(...this.#instanceDependencies);
    const testFn = tagFilter(scenario.tags, test as FrameworkTestCall, scenario.modifier);
    testFn(scenario.getScenarioTitle(), async () => {
      events.scenarioWrapper.emitStart();
      await runBeforeHooks(befores, app, onFailure);
      await runBackgrounds(scenario, app);
      try {
        events.scenario.emitStart({
          title,
          tags,
          modifier,
          args: [],
          uuid: id,
          description,
          examples,
        });
        const stepDefinitions = scenario.findMatchingSteps();
        await runSteps(stepDefinitions, app);
        events.scenario.emitEnd({ title, status: Status.PASSED, modifier });
      } catch (e) {
        events.scenario.emitEnd({ title, status: Status.FAILED, modifier, error: e as Error });
        throw e;
      } finally {
        await runAfterHooks(afters, app, onFailure);
        events.scenarioWrapper.emitEnd();
      }
    });
  }
}
async function runBackgrounds(scenario: GherkinScenario, app: unknown) {
  const backgrounds = scenario.message.backgrounds?.filter((it) => it);
  if (!backgrounds || backgrounds.length <= 0) {
    return;
  }
  for (const { background } of backgrounds) {
    if (!background) {
      continue;
    }
    events.before.emitStart({ description: `Background: ${background.name}` });
    const stepDefinitions = scenario.findMatchingBackgroundSteps();
    try {
      await runSteps(stepDefinitions, app);
      events.before.emitEnd({ status: Status.PASSED });
    } catch (e) {
      events.before.emitEnd({ status: Status.FAILED, error: e as Error });
    }
  }
}

async function runSteps(
  stepDefinitions: {
    found: {
      step: StoredStep;
      args: unknown[];
    };
    tableOrDocstring: Docstring | CompiledDataTable | undefined;
  }[],
  app: unknown
) {
  for (const step of stepDefinitions) {
    const {
      tableOrDocstring,
      found: {
        args,
        step: { tableType, text, keyword },
      },
    } = step;

    try {
      const params = getRealArgs(tableOrDocstring, args, app, tableType);
      events.step.emitStart({ text: text.source, keyword, args: params });
      await step.found.step.action(...params);
      events.step.emitEnd({ text, status: Status.FAILED });
    } catch (e) {
      const old = (e as Error).message;
      (e as Error).message = `Step "${keyword} ${text.source}" failed with message ${old}`;
      events.step.emitEnd({ text, status: Status.FAILED, error: [e] });
      throw e;
    }
  }
}

async function runBeforeHooks(befores: BeforeHook[], app: unknown, onFailure: OnFailure) {
  for (const hook of befores ?? []) {
    const { description } = hook;
    events.before.emitStart({ description });
    try {
      await hook.action(app);
      events.before.emitEnd({ description, status: Status.PASSED });
    } catch (e) {
      const oldMessage = (e as Error).message;
      (e as Error).message = `Hook 'Before' "${description} failed with message: ${oldMessage}`;
      events.before.emitEnd({ description, status: Status.FAILED, error: e as Error });
      onFailure();
      throw e;
    }
  }
}
async function runSetupHooks(setups: SetupHook[], app: unknown, onFailure: OnFailure) {
  for (const hook of setups ?? []) {
    const { description } = hook;
    events.setup.emitStart({ description });
    try {
      await hook.action(app);
      events.setup.emitEnd({ description, status: Status.PASSED });
    } catch (e) {
      const oldMessage = (e as Error).message;
      (e as Error).message = `Hook 'Before' "${description} failed with message: ${oldMessage}`;
      events.setup.emitEnd({ description, status: Status.FAILED, error: e as Error });
      onFailure();
      throw e;
    }
  }
}

async function runAfterHooks(afters: AfterHook[], app: unknown, onFailure: OnFailure) {
  for (const hook of afters?.reverse() ?? []) {
    const { description } = hook;
    events.after.emitStart({ description });
    try {
      await hook.action(app);
      events.after.emitEnd({ description, status: Status.PASSED });
    } catch (e) {
      const oldMessage = (e as Error).message;
      (e as Error).message = `Hook 'After' "${description} failed with message: ${oldMessage}`;
      events.after.emitEnd({ description, status: Status.FAILED, error: e as Error });
      onFailure();
      throw e;
    }
  }
}

async function runTeardownHooks(teardowns: TeardownHook[], onFailure: OnFailure) {
  for (const hook of teardowns?.reverse() ?? []) {
    const { description } = hook;
    events.teardown.emitStart({ description });
    try {
      await hook.action();
      events.teardown.emitEnd({ description, status: Status.PASSED });
    } catch (e) {
      const oldMessage = (e as Error).message;
      (e as Error).message = `Hook 'After' "${description} failed with message: ${oldMessage}`;
      events.teardown.emitEnd({ description, status: Status.FAILED, error: e as Error });
      onFailure();
      throw e;
    }
  }
}
function getRealArgs(
  tableOrDocstring: Docstring | CompiledDataTable | undefined,
  args: unknown[],
  app?: unknown,
  tableType?: TableType<ParsedDataTable>
) {
  const transformedTable = getTableOrDocstringArg(tableOrDocstring, tableType);

  const cucumberArgs = [...args];

  if (transformedTable) {
    cucumberArgs.push(transformedTable);
  }
  if (app) {
    cucumberArgs.push(app);
  }
  return cucumberArgs;
}

function getTableOrDocstringArg(
  tableOrDocstring: Docstring | CompiledDataTable | undefined,
  tableType?: TableType<ParsedDataTable>
) {
  const actualTableType: TableType<ParsedDataTable> = Config.get("dataTables.default", {
    dataTables: { default: tableType },
  });

  if (tableOrDocstring instanceof Docstring) {
    return tableOrDocstring;
  }

  if (tableOrDocstring) {
    return new actualTableType(tableOrDocstring);
  }
  return undefined;
}

function tagFilter(tags: string[], fn: FrameworkTestCall | TestGroup, modifiers?: Modifiers) {
  if (modifiers == "only") {
    return fn.only;
  }
  if (modifiers == "skip") {
    return fn.skip;
  }
  if (Config.has("tagFilter")) {
    const filter = Config.get("tagFilter");
    if (filter && !parse(Config.get("tagFilter")).evaluate(tags)) {
      return fn.skip;
    }
  }

  return fn;
}
