import { test, expectTypeOf } from "vitest";
import { CucumberExpressionArgs, StepActionFn, StepArgs } from "./types";
import {
  DataTable,
  HTable,
  NeverDataTable,
  TableDocument,
} from "@autometa/gherkin";
import { App } from "@autometa/app";
test("should extract a number cucumber expression argument", () => {
  const type = null as unknown as CucumberExpressionArgs<"{number}">;
  expectTypeOf(type).toEqualTypeOf<[number]>();
});

test("should extract multiple expression arguments from a sentence", () => {
  const type =
    null as unknown as CucumberExpressionArgs<"I have {number} cukes and {string} euro">;
  expectTypeOf(type).toEqualTypeOf<[number, string]>();
});

test("should ignore a NeverDataTable", () => {
  const type = null as unknown as StepArgs<
    "I have {number} cukes and {string} euro",
    NeverDataTable
  >;
  expectTypeOf(type).toEqualTypeOf<[number, string, App]>();
});
test("should ignore a HTable with multiple expression arguments", () => {
  const type = null as unknown as StepArgs<
    "I have {number} cukes and a {string}",
    NeverDataTable
  >;
  expectTypeOf(type).toEqualTypeOf<[number, string, App]>();
});

test("should include a HTable", () => {
  const type = null as unknown as StepArgs<"I have {number} cukes", HTable>;
  expectTypeOf(type).toEqualTypeOf<[number, HTable, App]>();
});

test("should include a HTable with multiple expression arguments", () => {
  const type = null as unknown as StepArgs<
    "I have {number} cukes and a {string}",
    HTable
  >;
  expectTypeOf(type).toEqualTypeOf<[number, string, HTable, App]>();
});

test("should create a step function from an expression with a HTable", () => {
  const type = null as unknown as StepArgs<
    "I have {number} cukes and a {string}",
    HTable
  >;
  expectTypeOf(type).toEqualTypeOf<[number, string, HTable, App]>();
});

test("should create a step function from an expression without a table", () => {
  const type = null as unknown as StepArgs<
    "I have {number} cukes and a {string}",
    NeverDataTable
  >;
  expectTypeOf(type).toEqualTypeOf<[number, string, App]>();
});

test("should create a step function from an expression with a table", () => {
  const type = null as unknown as StepActionFn<
    "I have {number} cukes and a {string}",
    HTable
  >;
  expectTypeOf(type).toEqualTypeOf<
    (...args: [number, string, HTable, App]) => unknown | Promise<unknown>
  >();
});

test("should create a step function from an expression with a table document", () => {
  const type = null as unknown as StepActionFn<
    "I have {number} cukes and a {string}",
    TableDocument<DataTable>
  >;
  expectTypeOf(type).toEqualTypeOf<
    (
      ...args: [number, string, TableDocument<DataTable>[], App]
    ) => unknown | Promise<unknown>
  >();
});

test("should create a step function from an expression without a table", () => {
  const type = null as unknown as StepActionFn<
    "I have {number} cukes and a {string}",
    NeverDataTable
  >;
  expectTypeOf(type).toEqualTypeOf<
    (...args: [number, string, App]) => unknown | Promise<unknown>
  >;
});
