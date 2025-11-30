/**
 * Node.js Module Loader Hooks for .feature files.
 *
 * These hooks intercept imports of .feature files and transform them into
 * executable Playwright test modules on-the-fly.
 *
 * @see https://nodejs.org/api/module.html#customization-hooks
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { generateBridgeCode } from "./bridge-generator.js";

interface ResolveContext {
  conditions: string[];
  importAttributes: Record<string, string>;
  parentURL?: string;
}

interface ResolveResult {
  format?: string;
  shortCircuit?: boolean;
  url: string;
}

type NextResolve = (
  specifier: string,
  context: ResolveContext
) => Promise<ResolveResult>;

interface LoadContext {
  conditions: string[];
  format?: string;
  importAttributes: Record<string, string>;
}

interface LoadResult {
  format: string;
  shortCircuit?: boolean;
  source: string | ArrayBuffer | SharedArrayBuffer;
}

type NextLoad = (url: string, context: LoadContext) => Promise<LoadResult>;

/**
 * Resolve hook - intercepts .feature file specifiers.
 *
 * When a .feature file is imported, we mark it with a custom format
 * so the load hook knows to transform it.
 */
export async function resolve(
  specifier: string,
  context: ResolveContext,
  nextResolve: NextResolve
): Promise<ResolveResult> {
  // Check if this is a .feature file import
  if (specifier.endsWith(".feature")) {
    // Resolve the full URL using the default resolver
    const resolved = await nextResolve(specifier, context);

    return {
      ...resolved,
      // Mark with our custom format so load() knows to transform it
      format: "autometa-feature",
    };
  }

  // Not a .feature file, use default resolution
  return nextResolve(specifier, context);
}

/**
 * Load hook - transforms .feature files into Playwright test modules.
 *
 * When a file with format "autometa-feature" is loaded, we:
 * 1. Read the .feature file content
 * 2. Generate bridge code that imports Playwright and executes the feature
 * 3. Return the generated code as an ESM module
 */
export async function load(
  url: string,
  context: LoadContext,
  nextLoad: NextLoad
): Promise<LoadResult> {
  // Check if this is a feature file we need to transform
  if (context.format === "autometa-feature") {
    const filePath = fileURLToPath(url);
    const featureContent = readFileSync(filePath, "utf-8");

    // Generate Playwright bridge code
    const bridgeCode = generateBridgeCode(filePath, featureContent);

    return {
      format: "module",
      shortCircuit: true,
      source: bridgeCode,
    };
  }

  // Not a feature file, use default loading
  return nextLoad(url, context);
}
