import { describe, expect, it, vi } from "vitest";
import { StepScope } from "./step-scope";
import {
  CucumberExpression,
  ParameterTypeRegistry,
} from "@cucumber/cucumber-expressions";
import { CompiledDataTable, HTable, StepBuilder } from "@autometa/gherkin";
import { AutometaApp, AutometaWorld, App, World } from "@autometa/app";
import { AutomationError } from "@autometa/errors";
import { Class } from "@autometa/types";
class MyWorld extends AutometaWorld implements World {
  [key: string]: unknown;
}
class MyApp extends AutometaApp implements App {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  di = {} as any;
  world = new MyWorld();
}
const app = new MyApp();
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
    const args = scope.getArgs("I have 42 cukes in my 'belly' now", app);
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
    const args = scope.getArgs("I have 42 cukes in my 'belly' now", app);
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

      scope.execute(gherkin, [], app);
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
          [42, "belly"],
        ],
        [
          ["cukes", "belly"],
          ["42", "belly"],
        ]
      );
      const gherkin = new StepBuilder()
        .keyword("Given")
        .keywordType("Context")
        .text("I have 42 cukes in my belly now")
        .table(table)
        .build();
      const error = () => scope.execute(gherkin, [], app);
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
          [42, "belly"],
        ],
        [
          ["cukes", "belly"],
          ["42", "belly"],
        ]
      );
      const gherkin = new StepBuilder()
        .keyword("Given")
        .keywordType("Context")
        .text("I have 42 cukes in my belly now")
        .table(table)
        .build();

      const error = () => scope.execute(gherkin, [], app);
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
          [42, "belly"],
        ],
        [
          ["cukes", "belly"],
          ["42", "belly"],
        ]
      );
      const gherkin = new StepBuilder()
        .keyword("Given")
        .keywordType("Context")
        .text("I have 42 cukes in my 'belly' now")
        .table(table)
        .build();
      const args = await scope.execute(gherkin, [], app);
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
          [42, "belly"],
        ],
        [
          ["cukes", "belly"],
          ["42", "belly"],
        ]
      );
      const gherkin = new StepBuilder()
        .keyword("Given")
        .keywordType("Context")
        .text("I have 42 cukes in my 'belly' now")
        .table(table)
        .build();

      await scope.execute(gherkin, [], app);
      expect(fn).toHaveBeenCalled();
    });
  });

  describe("table documents", () => {
    class MyDocument extends HTable.Document() {
      @HTable.cell("cukes")
      cukes!: number;
      @HTable.cell("belly")
      belly!: string;
    }

    it("should fail to execute with a gherkin table and a DataTableDocument prototype", async () => {
      const text = "I have {int} cukes in my {string} now";
      const expression = new CucumberExpression(
        text,
        new ParameterTypeRegistry()
      );
      const fn = vi
        .fn()
        .mockImplementation(
          (num: number, word: string, [doc]: MyDocument[]) => {
            expect(num).toBe(42);
            expect(word).toBe("belly");
            expect(doc).toBeInstanceOf(MyDocument);
            expect(doc.cukes).toBe(42);
            expect(doc.belly).toBe("belly");
          }
        );
      const scope = new StepScope<typeof text, MyDocument>(
        "Given",
        "Context",
        expression,
        fn,
        MyDocument
      );
      const table = new CompiledDataTable(
        [
          ["cukes", "belly"],
          [42, "belly"],
        ],
        [
          ["cukes", "belly"],
          ["42", "belly"],
        ]
      );
      const gherkin = new StepBuilder()
        .keyword("Given")
        .keywordType("Context")
        .text("I have 42 cukes in my 'belly' now")
        .table(table)
        .build();

      await scope.execute(gherkin, [42, "belly"], app);
      expect(fn).toHaveBeenCalled();
    });
  });
});
