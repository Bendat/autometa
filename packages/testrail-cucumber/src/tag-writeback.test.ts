import { describe, expect, it } from "vitest";

import { parseFeature } from "./parser";
import { computeScenarioSignature } from "./signature";
import { applyCaseTagsToFeatureText } from "./tag-writeback";

describe("applyCaseTagsToFeatureText", () => {
  it("adds @C<id> tag above scenarios using signatures", () => {
    const text = [
      "Feature: Login",
      "",
      "  Scenario: Happy path",
      "    Given I am on the login page",
      "",
      "  Scenario: Sad path",
      "    Given I am on the login page",
      "    When I enter invalid credentials",
    ].join("\n");

    const feature = parseFeature(text, "features/login.feature");

    const sigs = new Map<string, number>();
    for (const node of feature.children) {
      const sig = computeScenarioSignature({
        featurePath: feature.path,
        kind: node.kind,
        title: node.name,
        steps: node.steps,
        backgroundSteps: node.backgroundSteps,
        ...(node.kind === "outline"
          ? { exampleTables: node.examples.map((ex) => ({ headers: ex.headers, rowCount: ex.rows.length })) }
          : {}),
      });
      sigs.set(sig, node.name === "Happy path" ? 101 : 202);
    }

    const res = applyCaseTagsToFeatureText(text, feature, Object.fromEntries(sigs.entries()));

    expect(res.changed).toBe(true);
    expect(res.updatedText).toContain("@C101\n  Scenario: Happy path");
    expect(res.updatedText).toContain("@C202\n  Scenario: Sad path");
  });

  it("appends missing tags to an existing tag line", () => {
    const text = [
      "Feature: Login",
      "",
      "  @smoke",
      "  Scenario: Happy path",
      "    Given I am on the login page",
    ].join("\n");

    const feature = parseFeature(text, "features/login.feature");
    const node = feature.children[0];
    if (!node) {
      throw new Error("Expected at least one scenario in feature.");
    }
    const sig = computeScenarioSignature({
      featurePath: feature.path,
      kind: node.kind,
      title: node.name,
      steps: node.steps,
      backgroundSteps: node.backgroundSteps,
    });

    const res = applyCaseTagsToFeatureText(text, feature, { [sig]: 555 }, { suiteTag: "@testrail-suite-42" });

    expect(res.updatedText).toContain("  @smoke @C555 @testrail-suite-42\n  Scenario: Happy path");
  });
});
