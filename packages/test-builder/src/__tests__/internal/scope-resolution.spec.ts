import { describe, expect, it, vi } from "vitest";
import { createExecutionAdapter, createScopes } from "../../../../scopes/src";
import type { SimpleFeature } from "../../../../gherkin/src";
import { findChildScope, resolveFeatureScope } from "../../internal/scope-resolution";

const createFeatureNode = (name: string, extra?: Partial<SimpleFeature>): SimpleFeature => ({
  id: extra?.id ?? `${name}-id`,
  keyword: "Feature",
  language: "en",
  name,
  description: extra?.description ?? "",
  tags: extra?.tags ?? [],
  elements: extra?.elements ?? [],
  comments: extra?.comments ?? [],
  ...(extra?.uri ? { uri: extra.uri } : {}),
});

describe("scope resolution", () => {
  it("resolves a feature scope by trimmed name", () => {
    const scopes = createScopes();
    const { feature, scenario } = scopes;
    const createdFeature = feature("Login", () => {
      scenario("successful login", vi.fn());
    });

    const adapter = createExecutionAdapter(scopes.plan());
    const resolved = resolveFeatureScope(adapter, createFeatureNode("  Login  "));

    expect(resolved.id).toBe(createdFeature.id);
  });

  it("uses the feature uri to disambiguate duplicate names", () => {
    const scopes = createScopes();
    const { feature } = scopes;

    const primary = feature({ name: "Payments", file: "features/payments.feature" }, vi.fn());
    feature({ name: "Payments", file: "features/payments-alt.feature" }, vi.fn());

    const adapter = createExecutionAdapter(scopes.plan());

    const resolved = resolveFeatureScope(
      adapter,
      createFeatureNode("Payments", { uri: "features/payments.feature" })
    );

    expect(resolved.id).toBe(primary.id);
  });

  it("throws when no feature scope matches", () => {
    const scopes = createScopes();
    const { feature } = scopes;
    feature("Present feature", vi.fn());

    const adapter = createExecutionAdapter(scopes.plan());

    expect(() =>
      resolveFeatureScope(adapter, createFeatureNode("Missing"))
    ).toThrow(/No feature scope registered/);
  });

  it("throws when multiple feature scopes match without uri", () => {
    const scopes = createScopes();
    const { feature } = scopes;
    feature("Duplicated", vi.fn());
    feature("Duplicated", vi.fn());

    const adapter = createExecutionAdapter(scopes.plan());

    expect(() =>
      resolveFeatureScope(adapter, createFeatureNode("Duplicated"))
    ).toThrow(/Multiple feature scopes match/);
  });

  it("finds rule children and throws for missing or duplicate names", () => {
    const scopes = createScopes();
    const { feature, rule, scenario } = scopes;
    const parentFeature = feature("API", () => {
      rule("Auth", () => {
        scenario("login", vi.fn());
      });
      rule("Duplicate", vi.fn());
      rule("Duplicate", vi.fn());
    });

    const adapter = createExecutionAdapter(scopes.plan());
    const [featureScope] = adapter.features;
    if (!featureScope) {
      throw new Error("Expected feature scope to be registered");
    }

    expect(featureScope.id).toBe(parentFeature.id);
    const authScope = findChildScope(featureScope, "rule", "Auth");
    expect(authScope.name).toBe("Auth");

    expect(() => findChildScope(featureScope, "rule", "Missing")).toThrow(
      /Could not find rule scope/
    );

    expect(() => findChildScope(featureScope, "rule", "Duplicate")).toThrow(
      /Multiple rule scopes named 'Duplicate'/
    );
  });
});
