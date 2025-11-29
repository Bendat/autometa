import "reflect-metadata";
import { CucumberRunner, WORLD_TOKEN } from "@autometa/runner";
import { arithmeticWorldDefaults, type ArithmeticWorld } from "./world";

// ============================================================================
// RUNNER SETUP
// ============================================================================

const runner = CucumberRunner.builder()
  .withWorld<ArithmeticWorld>(arithmeticWorldDefaults);

/**
 * Steps environment - required export for the vitest-plugin to find.
 */
export const stepsEnvironment = runner.steps();

/**
 * Get decorator-based step definitions with DI support.
 * This provides @Binding, @Given, @When, @Then, @Injectable, @Inject decorators.
 */
export const {
  Binding,
  Given,
  When,
  Then,
  And,
  But,
  Injectable,
  Inject,
  LazyInject,
} = runner.bindingsTS();

// Re-export WORLD_TOKEN for convenience
export { WORLD_TOKEN };
