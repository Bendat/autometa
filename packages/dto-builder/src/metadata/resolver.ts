import type { BuilderConfig } from "../builder-factory";
import { blueprintToBuilderConfig, createEmptyBlueprint, mergeBlueprints, type BuilderBlueprint } from "./blueprint";

export function resolveBuilderConfig<T>(params: {
  createTarget: () => T;
  blueprints: Array<BuilderBlueprint<T>>;
}): BuilderConfig<T> {
  const normalized = params.blueprints.map((blueprint) => blueprint ?? createEmptyBlueprint<T>());
  const merged = mergeBlueprints(normalized);
  return blueprintToBuilderConfig(params.createTarget, merged);
}
