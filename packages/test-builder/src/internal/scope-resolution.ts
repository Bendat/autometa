import type { ScopeExecutionAdapter, ScopeNode } from "@autometa/scopes";
import type { SimpleFeature } from "@autometa/gherkin";
import { normalizeName, normalizeUri } from "./utils";

export function resolveFeatureScope<World>(
  adapter: ScopeExecutionAdapter<World>,
  feature: SimpleFeature
): ScopeNode<World> {
  const normalizedName = normalizeName(feature.name);
  const featureUri = feature.uri ? normalizeUri(feature.uri) : undefined;

  const matches = adapter.features.filter((scope) => {
    if (scope.kind !== "feature") {
      return false;
    }

    const scopeName = normalizeName(scope.name);
    if (scopeName !== normalizedName) {
      return false;
    }

    if (!featureUri) {
      return true;
    }

    const scopeFile = typeof scope.data?.file === "string" ? normalizeUri(scope.data.file) : undefined;
    return scopeFile ? scopeFile === featureUri : true;
  });

  if (matches.length === 1) {
    const [match] = matches;
    if (!match) {
      throw new Error("Unexpected empty feature scope match");
    }
    return match;
  }

  if (matches.length === 0) {
    throw new Error(
      `No feature scope registered for feature '${feature.name}'. Provide featureScope explicitly to resolve the association.`
    );
  }

  throw new Error(
    `Multiple feature scopes match feature '${feature.name}'. Provide featureScope explicitly to disambiguate.`
  );
}

export function findChildScope<World>(
  parent: ScopeNode<World>,
  kind: ScopeNode<World>["kind"],
  name: string
): ScopeNode<World> {
  const normalizedName = normalizeName(name);
  const matches = parent.children.filter(
    (child) => child.kind === kind && normalizeName(child.name) === normalizedName
  );

  if (matches.length === 1) {
    const [match] = matches;
    if (!match) {
      throw new Error("Unexpected empty child scope match");
    }
    return match;
  }

  if (matches.length === 0) {
    throw new Error(
      `Could not find ${kind} scope named '${name}' beneath '${parent.name}'`
    );
  }

  throw new Error(
    `Multiple ${kind} scopes named '${name}' were found beneath '${parent.name}'. Names must be unique within the same parent scope.`
  );
}
