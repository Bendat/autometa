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
import { AfterHook, BeforeHook } from "@scopes/hook";
import { executeSetupHooks } from "@scopes/hooks";
import { Class } from "@typing/class";
import { getApp } from "src/di/get-app";
import { EventSubscriber } from "src/events";
import { Status } from "src/events/test-status";
import { GherkinFeature } from "../gherkin/gherkin-feature";
import { OnFailure } from "./OnFailure";
export class TestExecutor {
  subscribers: EventSubscriber[];
  constructor(private feature: GherkinFeature) {
    const prototypes = Config.get<Class<EventSubscriber>[]>("subscribers");
    this.subscribers = prototypes?.map((it) => new it());
    this.subscribers?.forEach((it) => events.load(it));
  }
  execute() {
    const { beforeAll, afterAll, describe } = Config.get<TestFunctions>("runner");

    const featureGroup = tagFilter(this.feature.tags, describe, this.feature.modifier);
    let failed = false;
    function failFeature() {
      failed = true;
    }
    afterAll(() => {
      failed = true;
    });
    beforeAll(async (...args) => {
      events.feature.emitStart({ title, path, tags, modifier });
      await executeSetupHooks(this.feature.hooks?.setup, events.setup, ...args);
    });
    afterAll(async (...args) => {
      await executeSetupHooks(this.feature.hooks?.teardown, events.teardown, ...args);
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

  private runRule(child: GherkinRule, onFailure: OnFailure) {
    const { beforeAll, afterAll, describe } = Config.get<TestFunctions>("runner");

    const ruleGroup = tagFilter(child.tags, describe, child.modifier);
    ruleGroup(`Rule ${child.message.name}`, () => {
      const { title, modifier, tags } = child;
      let failed = false;
      function failRule() {
        failed = true;
        onFailure();
      }
      beforeAll(async (...args) => {
        events.rule.emitStart({ title, modifier, tags });
        await executeSetupHooks(child.hooks?.setup, events.setup, failRule, ...args);
      });
      afterAll(async (...args) => {
        await executeSetupHooks(child.hooks?.teardown, events.teardown, failRule, ...args);
      });
      afterAll(async () => {
        events.rule.emitEnd({ title, status: failed ? Status.FAILED : Status.PASSED });
      });
      for (const ruleChild of child.childer) {
        if (ruleChild instanceof GherkinScenarioOutline) {
          this.runOutline(ruleChild, failRule);
        }

        if (ruleChild instanceof GherkinScenario) {
          this.runScenario(ruleChild, child.hooks?.before, child.hooks?.after, failRule);
        }
      }
    });
  }

  private runOutline(outline: GherkinScenarioOutline, onFailure: OnFailure) {
    const { beforeAll, afterAll, describe } = Config.get<TestFunctions>("runner");
    const outlineGroup = tagFilter(outline.tags, describe, outline.modifier);
    outlineGroup(`Scenario Outline: ${outline.message.name}`, () => {
      const { title, tags, modifier, examples } = outline;
      let failed = false;
      function failOutline() {
        failed = true;
        onFailure();
      }
      events.scenarioOutline.emitStart({ title, tags, modifier, examples });
      beforeAll(async (...args) => {
        events.scenarioOutline.emitStart({ title, tags, modifier, examples });
        await executeSetupHooks(outline.hooks?.setup, events.setup, failOutline, ...args);
      });
      afterAll(async (...args) => {
        await executeSetupHooks(outline.hooks?.teardown, events.teardown, failOutline, ...args);
      });
      afterAll(async () => {
        events.scenarioOutline.emitEnd({ title, status: failed ? Status.FAILED : Status.PASSED });
      });
      const scenarios = outline.scenarios;
      for (const scenario of scenarios) {
        this.runScenario(scenario, outline.hooks?.before, outline.hooks?.after, failOutline);
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
    const { title, tags, modifier } = scenario;

    const app = getApp();
    const testFn = tagFilter(scenario.tags, test as FrameworkTestCall, scenario.modifier);
    testFn(scenario.getScenarioTitle(), async () => {
      await runBeforeHooks(befores, app, onFailure);
      try {
        events.scenario.emitStart({ title, tags, modifier, args: [] });
        const stepDefinitions = scenario.findMatchingSteps();
        await runSteps(stepDefinitions, app);
        events.scenario.emitEnd({ title, status: Status.PASSED });
      } catch (e) {
        events.scenario.emitEnd({ title, status: Status.FAILED, errors: [e] });
        throw e;
      } finally {
        await runAfterHooks(afters, app, onFailure);
      }
    });
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
      (e as Error).message = `Step "${keyword} ${text}" failed with message ${old}`;
      events.step.emitEnd({ text, status: Status.FAILED, errors: [e] });
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
      events.before.emitEnd({ description, status: Status.FAILED, errors: [e] });
      onFailure();
      throw e;
    }
  }
}

async function runAfterHooks(afters: AfterHook[], app: unknown, onFailure: OnFailure) {
  for (const hook of afters ?? []) {
    events.after.emitStart();
    const { description } = hook;
    try {
      await hook.action(app);
      events.after.emitEnd({ description, status: Status.PASSED });
    } catch (e) {
      const oldMessage = (e as Error).message;
      (e as Error).message = `Hook 'After' "${description} failed with message: ${oldMessage}`;
      events.after.emitEnd({ description, status: Status.FAILED, errors: [e] });
      onFailure();
      throw e;
    }
  }
}

function getRealArgs(
  tableOrDocstring: Docstring | CompiledDataTable | undefined,
  args: unknown[],
  app?: unknown,
  tableType?: TableType<unknown>
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
  tableType?: TableType<unknown>
) {
  const defaultTable: TableType<unknown> = Config.get("dataTables.default", {
    dataTables: { default: tableType },
  });

  if (tableOrDocstring instanceof Docstring) {
    return tableOrDocstring;
  }
  if (tableOrDocstring) {
    return new defaultTable(tableOrDocstring);
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
