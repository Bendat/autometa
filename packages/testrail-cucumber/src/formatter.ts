/**
 * Gherkin feature file formatter using @cucumber/gherkin-utils.
 *
 * This module provides a function to pretty-print Gherkin feature files,
 * ensuring consistent formatting after tag writeback operations.
 */

import {
  AstBuilder,
  GherkinClassicTokenMatcher,
  Parser,
} from "@cucumber/gherkin";
import { pretty } from "@cucumber/gherkin-utils";
import { IdGenerator } from "@cucumber/messages";

/**
 * Format a Gherkin feature file using the official Cucumber pretty-printer.
 *
 * This re-parses the feature text and outputs it with consistent formatting:
 * - Proper indentation (2 spaces per level)
 * - Aligned table columns
 * - Normalized whitespace
 *
 * If parsing fails (e.g., invalid Gherkin after tag insertion), returns
 * the original text unchanged.
 *
 * @param text - The feature file content to format
 * @returns The formatted feature file content, or original if parsing fails
 */
export function formatFeatureFile(text: string): string {
  try {
    const uuidFn = IdGenerator.uuid();
    const builder = new AstBuilder(uuidFn);
    const matcher = new GherkinClassicTokenMatcher();
    const parser = new Parser(builder, matcher);

    const gherkinDocument = parser.parse(text);
    const formatted = pretty(gherkinDocument, "gherkin");

    return formatted;
  } catch {
    // If parsing fails, return original text unchanged
    return text;
  }
}
