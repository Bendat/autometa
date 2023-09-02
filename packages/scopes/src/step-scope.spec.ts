import { describe, expect, it, vi } from "vitest";
import { StepScope } from "./step-scope";
import {
  CucumberExpression,
  ParameterTypeRegistry
} from "@cucumber/cucumber-expressions";
import {
  CompiledDataTable,
  HTable,
  ScenarioBuilder,
  StepBuilder
} from "@autometa/gherkin";
import { AutometaApp, AutometaWorld } from "@autometa/app";
import { AutomationError } from "@autometa/errors";
import { Class } from "@autometa/types";
class World extends AutometaWorld {}
class App extends AutometaApp {
  world = new World();
}
describe("step-scope", () => {
  it("should match a text string", () => {
    const text = "I have {int} cukes in my {string} now";
    const expression = new CucumberExpression(
      text,
      new ParameterTypeRegistry()
    );
    const scope = new StepScope<typeof text, undefined>(
      "Given",
      "Context",
      expression,
      () => undefined
    );
    const match = scope.matches("I have 42 cukes in my 'belly' now");
    expect(match).toBe(true);
    const args = scope.getArgs("I have 42 cukes in my 'belly' now");
    expect(args).toEqual([42, "belly"]);
  });
  it("it should get the args of a text string", () => {
    const text = "I have {int} cukes in my {string} now";
    const expression = new CucumberExpression(
      text,
      new ParameterTypeRegistry()
    );
    const scope = new StepScope<typeof text, undefined>(
      "Given",
      "Context",
      expression,
      () => undefined
    );
    const args = scope.getArgs("I have 42 cukes in my 'belly' now");
    expect(args).toEqual([42, "belly"]);
  });

  describe("execute", () => {
    it("should execute a step", async () => {
      const text = "I have {int} cukes in my {string} now";
      const expression = new CucumberExpression(
        text,
        new ParameterTypeRegistry()
      );
      const fn = vi.fn();
      const scope = new StepScope<typeof text, undefined>(
        "Given",
        "Context",
        expression,
        fn
      );
      const gherkin = new StepBuilder()
        .keyword("Given")
        .keywordType("Context")
        .text("I have 42 cukes in my belly now")
        .build();
      const scenario = new ScenarioBuilder().build();

      scope.execute(scenario, gherkin, new App());
      expect(fn).toHaveBeenCalled();
    });

    it("should fail to execute with a gherkin table and no prototype", async () => {
      const text = "I have {int} cukes in my {string} now";
      const expression = new CucumberExpression(
        text,
        new ParameterTypeRegistry()
      );
      const fn = vi.fn();
      const scope = new StepScope<typeof text, undefined>(
        "Given",
        "Context",
        expression,
        fn
      );
      const table = new CompiledDataTable(
        [
          ["cukes", "belly"],
          [42, "belly"]
        ],
        [
          ["cukes", "belly"],
          ["42", "belly"]
        ]
      );
      const gherkin = new StepBuilder()
        .keyword("Given")
        .keywordType("Context")
        .text("I have 42 cukes in my belly now")
        .table(table)
        .build();
      const scenario = new ScenarioBuilder().build();
      const error = () => scope.execute(scenario, gherkin, new App());
      await expect(error).rejects.toThrow(AutomationError);
      await expect(error).rejects
        .toThrow(`Step 'Given I have 42 cukes in my belly now' has a table but no table prototype was provided.

  To define a table for this step, add a class reference to one of the tables, like HTable or VTable, to your step
  definition as the last argument

  Given('text', (table, app)=>{}, HTable)`);
    });

    it("should fail to execute with a gherkin table and an invalid prototype", async () => {
      const text = "I have {int} cukes in my {string} now";
      const expression = new CucumberExpression(
        text,
        new ParameterTypeRegistry()
      );
      const fn = vi.fn();
      const scope = new StepScope<typeof text, HTable>(
        "Given",
        "Context",
        expression,
        fn,
        String as unknown as Class<HTable>
      );
      const table = new CompiledDataTable(
        [
          ["cukes", "belly"],
          [42, "belly"]
        ],
        [
          ["cukes", "belly"],
          ["42", "belly"]
        ]
      );
      const gherkin = new StepBuilder()
        .keyword("Given")
        .keywordType("Context")
        .text("I have 42 cukes in my belly now")
        .table(table)
        .build();
      const scenario = new ScenarioBuilder().build();

      const error = () => scope.execute(scenario, gherkin, new App());
      expect(error).rejects.toThrow(
        `Step 'Given I have 42 cukes in my belly now' has a table but the table prototype provided is not a DataTable or DataTableDocument`
      );
    });
    it("should execute with a gherkin table and a DataTable prototype", async () => {
      const text = "I have {int} cukes in my {string} now";
      const expression = new CucumberExpression(
        text,
        new ParameterTypeRegistry()
      );
      const fn = vi.fn();
      const scope = new StepScope<typeof text, HTable>(
        "Given",
        "Context",
        expression,
        fn,
        HTable
      );
      const table = new CompiledDataTable(
        [
          ["cukes", "belly"],
          [42, "belly"]
        ],
        [
          ["cukes", "belly"],
          ["42", "belly"]
        ]
      );
      const gherkin = new StepBuilder()
        .keyword("Given")
        .keywordType("Context")
        .text("I have 42 cukes in my 'belly' now")
        .table(table)
        .build();
      const scenario = new ScenarioBuilder().build();

      const args = await scope.execute(scenario, gherkin, new App());
      expect(args).toBeUndefined();
    });

    it("should execute with a gherkin table and a HTable prototype", async () => {
      const text = "I have {int} cukes in my {string} now";
      const expression = new CucumberExpression(
        text,
        new ParameterTypeRegistry()
      );
      const fn = vi.fn();
      const scope = new StepScope<typeof text, HTable>(
        "Given",
        "Context",
        expression,
        fn,
        HTable
      );
      const table = new CompiledDataTable(
        [
          ["cukes", "belly"],
          [42, "belly"]
        ],
        [
          ["cukes", "belly"],
          ["42", "belly"]
        ]
      );
      const gherkin = new StepBuilder()
        .keyword("Given")
        .keywordType("Context")
        .text("I have 42 cukes in my 'belly' now")
        .table(table)
        .build();
      const scenario = new ScenarioBuilder().build();

      await scope.execute(scenario, gherkin, new App());
      expect(fn).toHaveBeenCalled();
    });
  });
});
