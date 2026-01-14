import type {
  HeaderlessTable,
  HeaderlessTableOptions,
  HorizontalTable,
  HorizontalTableOptions,
  MatrixTable,
  MatrixTableOptions,
  TableShape,
  VerticalTable,
  VerticalTableOptions,
} from "@autometa/gherkin";
import type { RawTable, StepRuntimeHelpers, StepRuntimeMetadata } from "@autometa/executor";

import type { AssertionPlugin } from "../plugins";

/**
 * Assertion facet attached as `ensure.runtime.*`.
 *
 * This facet is meant for **step-data ergonomics**:
 * - quick preconditions like “a table is present” / “a docstring is present”
 * - extracting required docstrings/tables with consistently-labeled failures
 *
 * It intentionally uses `ensure.always(...)` for required-value extraction so
 * plugin-level negation (`ensure.not.runtime.*`) does **not** invert these
 * preconditions.
 */
export interface RuntimeAssertions {
  /**
   * Assert that the current step has an attached data table.
   *
   * Works with plugin-level negation:
   * - `ensure.runtime.hasTable()` asserts table is present
   * - `ensure.not.runtime.hasTable()` asserts table is NOT present
   */
  hasTable(options?: { readonly label?: string }): void;

  /**
   * Assert that the current step has an attached docstring.
   *
   * Works with plugin-level negation:
   * - `ensure.runtime.hasDocstring()` asserts docstring is present
   * - `ensure.not.runtime.hasDocstring()` asserts docstring is NOT present
   */
  hasDocstring(options?: { readonly label?: string }): void;

  /**
   * Get the current step's docstring without consuming it.
   */
  docstring(): string | undefined;

  /**
   * Consume and return the current step's docstring.
   */
  consumeDocstring(): string | undefined;

  /**
   * Consume and return the current step's docstring.
   *
   * This is a *required extraction* helper. It is NOT negated under
   * `ensure.not.runtime.*`.
   */
  requireDocstring(options?: { readonly label?: string }): string;

  /**
   * Get the current step's data table coerced to the given shape without consuming it.
   */
  table(shape: "headerless", options?: HeaderlessTableOptions): HeaderlessTable | undefined;
  /** @inheritdoc */
  table(shape: "horizontal", options?: HorizontalTableOptions): HorizontalTable | undefined;
  /** @inheritdoc */
  table(shape: "vertical", options?: VerticalTableOptions): VerticalTable | undefined;
  /** @inheritdoc */
  table(shape: "matrix", options?: MatrixTableOptions): MatrixTable | undefined;
  /** @inheritdoc */
  table(
    shape: TableShape,
    options?:
      | HeaderlessTableOptions
      | HorizontalTableOptions
      | VerticalTableOptions
      | MatrixTableOptions
  ): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable | undefined;

  /**
   * Consume and return the current step's data table coerced to the given shape.
   */
  consumeTable(shape: "headerless", options?: HeaderlessTableOptions): HeaderlessTable | undefined;
  /** @inheritdoc */
  consumeTable(shape: "horizontal", options?: HorizontalTableOptions): HorizontalTable | undefined;
  /** @inheritdoc */
  consumeTable(shape: "vertical", options?: VerticalTableOptions): VerticalTable | undefined;
  /** @inheritdoc */
  consumeTable(shape: "matrix", options?: MatrixTableOptions): MatrixTable | undefined;
  /** @inheritdoc */
  consumeTable(
    shape: TableShape,
    options?:
      | HeaderlessTableOptions
      | HorizontalTableOptions
      | VerticalTableOptions
      | MatrixTableOptions
  ): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable | undefined;

  /**
   * Consume and return the current step's data table coerced to the given shape.
   *
   * This is a *required extraction* helper. It is NOT negated under
   * `ensure.not.runtime.*`.
   */
  requireTable(
    shape: "headerless",
    options?: HeaderlessTableOptions & { readonly label?: string }
  ): HeaderlessTable;
  /** @inheritdoc */
  requireTable(
    shape: "horizontal",
    options?: HorizontalTableOptions & { readonly label?: string }
  ): HorizontalTable;
  /** @inheritdoc */
  requireTable(
    shape: "vertical",
    options?: VerticalTableOptions & { readonly label?: string }
  ): VerticalTable;
  /** @inheritdoc */
  requireTable(
    shape: "matrix",
    options?: MatrixTableOptions & { readonly label?: string }
  ): MatrixTable;
  /** @inheritdoc */
  requireTable(
    shape: TableShape,
    options?: (
      | HeaderlessTableOptions
      | HorizontalTableOptions
      | VerticalTableOptions
      | MatrixTableOptions
    ) & { readonly label?: string }
  ): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable;

  /**
   * Return the underlying raw data table (array of string arrays) without consuming it.
   *
   * This is useful for custom table parsing or user-defined table semantics.
   */
  rawTable(): RawTable | undefined;

  /**
   * Consume the current step's raw data table.
   */
  consumeRawTable(options?: HeaderlessTableOptions): RawTable | undefined;

  /**
   * Consume and return the current step's raw data table.
   *
   * This is a *required extraction* helper. It is NOT negated under
   * `ensure.not.runtime.*`.
   */
  requireRawTable(options?: HeaderlessTableOptions & { readonly label?: string }): RawTable;

  /**
   * Return runtime metadata about the current feature/scenario/step, if available.
   */
  stepMetadata(): StepRuntimeMetadata | undefined;
}

type WorldWithRuntime = {
  readonly runtime: StepRuntimeHelpers;
};

/**
 * Standard assertion plugin that provides step-runtime helpers as `ensure.runtime.*`.
 *
 * Register via the runner:
 *
 * ```ts
 * const runner = CucumberRunner.builder()
 *   .assertionPlugins({ runtime: runtimeAssertionsPlugin<MyWorld>() });
 * ```
 */
export const runtimeAssertionsPlugin = <
  World extends WorldWithRuntime,
>(): AssertionPlugin<World, RuntimeAssertions> =>
  ({ ensure }) =>
  (world) => {
    const defaultTableLabel = "step data table";
    const defaultDocstringLabel = "step docstring";

    function table(
      shape: "headerless",
      options?: HeaderlessTableOptions
    ): HeaderlessTable | undefined;
    function table(
      shape: "horizontal",
      options?: HorizontalTableOptions
    ): HorizontalTable | undefined;
    function table(
      shape: "vertical",
      options?: VerticalTableOptions
    ): VerticalTable | undefined;
    function table(
      shape: "matrix",
      options?: MatrixTableOptions
    ): MatrixTable | undefined;
    function table(
      shape: TableShape,
      options?:
        | HeaderlessTableOptions
        | HorizontalTableOptions
        | VerticalTableOptions
        | MatrixTableOptions
    ): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable | undefined;
    function table(
      shape: TableShape,
      options?:
        | HeaderlessTableOptions
        | HorizontalTableOptions
        | VerticalTableOptions
        | MatrixTableOptions
    ): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable | undefined {
      return world.runtime.getTable(shape, options as never);
    }

    function consumeTable(
      shape: "headerless",
      options?: HeaderlessTableOptions
    ): HeaderlessTable | undefined;
    function consumeTable(
      shape: "horizontal",
      options?: HorizontalTableOptions
    ): HorizontalTable | undefined;
    function consumeTable(
      shape: "vertical",
      options?: VerticalTableOptions
    ): VerticalTable | undefined;
    function consumeTable(
      shape: "matrix",
      options?: MatrixTableOptions
    ): MatrixTable | undefined;
    function consumeTable(
      shape: TableShape,
      options?:
        | HeaderlessTableOptions
        | HorizontalTableOptions
        | VerticalTableOptions
        | MatrixTableOptions
    ): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable | undefined;
    function consumeTable(
      shape: TableShape,
      options?:
        | HeaderlessTableOptions
        | HorizontalTableOptions
        | VerticalTableOptions
        | MatrixTableOptions
    ): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable | undefined {
      return world.runtime.consumeTable(shape, options as never);
    }

    function requireTable(
      shape: "headerless",
      options?: HeaderlessTableOptions & { readonly label?: string }
    ): HeaderlessTable;
    function requireTable(
      shape: "horizontal",
      options?: HorizontalTableOptions & { readonly label?: string }
    ): HorizontalTable;
    function requireTable(
      shape: "vertical",
      options?: VerticalTableOptions & { readonly label?: string }
    ): VerticalTable;
    function requireTable(
      shape: "matrix",
      options?: MatrixTableOptions & { readonly label?: string }
    ): MatrixTable;
    function requireTable(
      shape: TableShape,
      options?: (
        | HeaderlessTableOptions
        | HorizontalTableOptions
        | VerticalTableOptions
        | MatrixTableOptions
      ) & { readonly label?: string }
    ): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable;
    function requireTable(
      shape: TableShape,
      options?: (
        | HeaderlessTableOptions
        | HorizontalTableOptions
        | VerticalTableOptions
        | MatrixTableOptions
      ) & { readonly label?: string }
    ): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable {
      const { label, ...tableOptions } = (options ?? {}) as {
        readonly label?: string;
      } & (
        | HeaderlessTableOptions
        | HorizontalTableOptions
        | VerticalTableOptions
        | MatrixTableOptions
      );

      const table = consumeTable(shape, tableOptions);
      return ensure.always(table, {
        label:
          label ??
          `Expected ${shape} ${defaultTableLabel} to be attached to the current step.`,
      })
        .toBeDefined()
        .value as HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable;
    }

    function consumeRawTable(options?: HeaderlessTableOptions): RawTable | undefined {
      // `getRawTable()` does not consume; to consume we piggy-back on consuming a
      // headerless table.
      const tableInstance = consumeTable("headerless", options);
      return tableInstance?.raw();
    }

    function requireRawTable(
      options?: HeaderlessTableOptions & { readonly label?: string }
    ): RawTable {
      const { label, ...tableOptions } = (options ?? {}) as {
        readonly label?: string;
      } & HeaderlessTableOptions;

      const raw = consumeRawTable(tableOptions);
      return ensure.always(raw, {
        label: label ?? `Expected ${defaultTableLabel} to be attached to the current step.`,
      })
        .toBeDefined()
        .value;
    }

    return {
      hasTable(options) {
        ensure(world.runtime.hasTable, {
          label: options?.label ?? `${defaultTableLabel} is present`,
        }).toBeTruthy();
      },
      hasDocstring(options) {
        ensure(world.runtime.hasDocstring, {
          label: options?.label ?? `${defaultDocstringLabel} is present`,
        }).toBeTruthy();
      },
      docstring() {
        return world.runtime.getDocstring();
      },
      consumeDocstring() {
        return world.runtime.consumeDocstring();
      },
      requireDocstring(options) {
        const docstring = world.runtime.consumeDocstring();
        return ensure.always(docstring, {
          label:
            options?.label ??
            `Expected ${defaultDocstringLabel} to be attached to the current step.`,
        })
          .toBeDefined()
          .value as string;
      },
      table,
      consumeTable,
      requireTable,
      rawTable() {
        return world.runtime.getRawTable();
      },
      consumeRawTable,
      requireRawTable,
      stepMetadata() {
        return world.runtime.getStepMetadata();
      },
    };
  };
