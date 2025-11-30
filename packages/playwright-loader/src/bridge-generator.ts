/**
 * Bridge Code Generator for Playwright.
 *
 * Generates TypeScript/JavaScript code that transforms a Gherkin feature file
 * into a Playwright test suite using `test.describe` and `test()`.
 */

import { basename, dirname, relative } from "node:path";

/**
 * Generate Playwright bridge code for a .feature file.
 *
 * The generated code:
 * 1. Imports Playwright's test and expect
 * 2. Imports the Autometa runner and config
 * 3. Parses the feature file
 * 4. Creates test.describe blocks for Features
 * 5. Creates test() blocks for Scenarios
 *
 * @param featurePath - Absolute path to the .feature file
 * @param featureContent - Raw content of the .feature file
 * @returns Generated ESM module code
 */
export function generateBridgeCode(
  featurePath: string,
  _featureContent: string
): string {
  const featureName = basename(featurePath, ".feature");
  const featureDir = dirname(featurePath);

  // Generate the bridge code
  // This is a placeholder implementation - the real implementation will:
  // 1. Parse the Gherkin content using @autometa/gherkin
  // 2. Load the autometa.config.ts to find step definitions
  // 3. Generate test blocks that execute steps

  return `
import { test, expect } from '@playwright/test';
import { executeFeature } from '@autometa/runner';
import { loadConfig } from '@autometa/config';

// Feature: ${featureName}
// Source: ${relative(process.cwd(), featurePath)}

const featurePath = ${JSON.stringify(featurePath)};
const featureDir = ${JSON.stringify(featureDir)};

// Load config and execute feature
const config = await loadConfig({ cwd: featureDir });

test.describe('${featureName}', () => {
  // TODO: Parse feature and generate individual test blocks
  // For now, execute the entire feature as a single test
  test('feature execution', async ({ page }) => {
    // The executeFeature function will be enhanced to support Playwright context
    // For now, this is a placeholder that shows the structure
    console.log('Executing feature:', featurePath);
    
    // Real implementation will:
    // 1. Parse the .feature file
    // 2. Match steps to step definitions
    // 3. Execute each scenario with Playwright's page fixture
  });
});
`;
}

/**
 * Generate individual test blocks for each scenario in a feature.
 *
 * @param scenarios - Parsed scenario objects from Gherkin
 * @returns Generated test block code
 */
export function generateScenarioTests(
  scenarios: Array<{ name: string; steps: Array<{ text: string }> }>
): string {
  return scenarios
    .map(
      (scenario) => `
  test('${escapeString(scenario.name)}', async ({ page }) => {
    // Steps:
${scenario.steps.map((step) => `    // - ${step.text}`).join("\n")}
    
    // TODO: Execute steps with step definition matching
  });
`
    )
    .join("\n");
}

/**
 * Escape a string for use in generated code.
 */
function escapeString(str: string): string {
  return str.replace(/'/g, "\\'").replace(/\n/g, "\\n");
}
