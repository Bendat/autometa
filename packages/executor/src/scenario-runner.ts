import type { ScopeExecutionAdapter, SourceRef } from "@autometa/scopes";
import type { ScenarioExecution, ScenarioOutlineExample } from "@autometa/test-builder";
import type {
  SimpleExampleGroup,
  SimpleLocation,
  SimpleScenario,
} from "@autometa/gherkin";
import {
  clearStepDocstring,
  clearStepTable,
  clearStepMetadata,
  setStepDocstring,
  setStepMetadata,
  setStepTable,
  type StepRuntimeMetadata,
} from "./runtime/step-data";
import { isScenarioPendingError } from "./pending";

export interface ScenarioRunContext<World> {
  readonly adapter: ScopeExecutionAdapter<World>;
}

export async function runScenarioExecution<World>(
  execution: ScenarioExecution<World>,
  context: ScenarioRunContext<World>
): Promise<void> {
  execution.reset();
  const world = await context.adapter.createWorld();
  const disposeWorld = createWorldDisposer(world);

  try {
    const { steps, gherkinSteps } = execution;
    for (let index = 0; index < steps.length; index++) {
      const step = steps[index];
      if (!step) {
        continue;
      }
      const gherkinStep = gherkinSteps[index];
      try {
        const metadata = buildStepMetadata(execution, index);
        setStepMetadata(world, metadata);
        setStepTable(world, gherkinStep?.dataTable);
        setStepDocstring(world, gherkinStep?.docString?.content);
        await step.handler(world);
      } finally {
        clearStepTable(world);
        clearStepDocstring(world);
        clearStepMetadata(world);
      }
    }
    execution.markPassed();
  } catch (error) {
    if (isScenarioPendingError(error)) {
      execution.markPending(error.reason);
      return;
    }
    execution.markFailed(error);
    throw error;
  } finally {
    await disposeWorld();
  }
}

function buildStepMetadata<World>(
  execution: ScenarioExecution<World>,
  index: number
): StepRuntimeMetadata | undefined {
  const stepDefinition = execution.steps[index];
  const gherkinStep = execution.gherkinSteps[index];
  const featureNode = execution.feature;
  const feature = featureNode.feature;

  const featureSource = combineSourceRef(
    featureNode.scope.source,
    feature.uri,
    feature.location
  );
  const featureMeta = {
    name: featureNode.name,
    keyword: featureNode.keyword,
    uri: feature.uri,
    ...(featureSource ? { source: featureSource } : {}),
  } as StepRuntimeMetadata["feature"];

  const scenarioSource = combineSourceRef(
    execution.scope.source,
    feature.uri,
    extractScenarioLocation(execution)
  );
  const scenarioMeta = {
    name: execution.name,
    keyword: execution.keyword,
    ...(scenarioSource ? { source: scenarioSource } : {}),
  } as StepRuntimeMetadata["scenario"];

  const outlineMeta = execution.outline
    ? (() => {
        const outlineSource = combineSourceRef(
          execution.outline?.scope.source,
          feature.uri,
          execution.outline.outline.location
        );
        return {
          name: execution.outline.name,
          keyword: execution.outline.keyword,
          ...(outlineSource ? { source: outlineSource } : {}),
        } as StepRuntimeMetadata["outline"];
      })()
    : undefined;

  const exampleMeta = isScenarioOutlineExample(execution)
    ? (() => {
        const group = execution.exampleGroup;
        const exampleSource = combineSourceRef(
          undefined,
          feature.uri,
          group.location
        );
        return {
          name: group.name,
          index: execution.exampleIndex,
          values: buildExampleValues(group, execution.exampleIndex),
          ...(exampleSource ? { source: exampleSource } : {}),
        } as StepRuntimeMetadata["example"];
      })()
    : undefined;

  const stepMeta = gherkinStep
    ? (() => {
        const stepSource = combineSourceRef(
          undefined,
          feature.uri,
          gherkinStep.location
        );
        return {
          keyword: gherkinStep.keyword,
          text: gherkinStep.text,
          ...(stepSource ? { source: stepSource } : {}),
        } as StepRuntimeMetadata["step"];
      })()
    : undefined;

  const definitionMeta = stepDefinition
    ? (() => {
        const definitionSource = combineSourceRef(
          stepDefinition.source,
          feature.uri
        );
        return {
          keyword: stepDefinition.keyword,
          expression: stepDefinition.expression,
          ...(definitionSource ? { source: definitionSource } : {}),
        } as StepRuntimeMetadata["definition"];
      })()
    : undefined;

  const metadata: StepRuntimeMetadata = {
    ...(featureMeta ? { feature: featureMeta } : {}),
    ...(scenarioMeta ? { scenario: scenarioMeta } : {}),
    ...(outlineMeta ? { outline: outlineMeta } : {}),
    ...(exampleMeta ? { example: exampleMeta } : {}),
    ...(stepMeta ? { step: stepMeta } : {}),
    ...(definitionMeta ? { definition: definitionMeta } : {}),
  };

  return hasMetadata(metadata) ? metadata : undefined;
}

function combineSourceRef(
  source: SourceRef | undefined,
  uri?: string,
  location?: SimpleLocation
): SourceRef | undefined {
  const file = source?.file ?? uri;
  const line = source?.line ?? location?.line;
  const column = source?.column ?? location?.column;

  if (file === undefined && line === undefined && column === undefined) {
    return undefined;
  }

  return {
    ...(file !== undefined ? { file } : {}),
    ...(line !== undefined ? { line } : {}),
    ...(column !== undefined ? { column } : {}),
  } satisfies SourceRef;
}

function extractScenarioLocation<World>(
  execution: ScenarioExecution<World>
): SimpleLocation | undefined {
  if (execution.type === "example") {
    return execution.outline?.outline.location;
  }
  const scenario = execution.gherkin as SimpleScenario;
  return scenario.location;
}

function isScenarioOutlineExample<World>(
  execution: ScenarioExecution<World>
): execution is ScenarioOutlineExample<World> {
  return execution.type === "example";
}

function buildExampleValues(
  group: SimpleExampleGroup,
  index: number
): Readonly<Record<string, string>> {
  const values: Record<string, string> = {};
  const headers = group.tableHeader;
  const row = group.tableBody[index] ?? [];
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    if (header === undefined || header.length === 0) {
      continue;
    }
    values[header] = row[i] ?? "";
  }
  return Object.freeze(values);
}

function hasMetadata(metadata: StepRuntimeMetadata): boolean {
  return Boolean(
    metadata.feature ||
      metadata.scenario ||
      metadata.outline ||
      metadata.example ||
      metadata.step ||
      metadata.definition
  );
}

interface DisposableLike {
  dispose(): void | Promise<void>;
}

function createWorldDisposer(world: unknown): () => Promise<void> {
  const disposers: Array<() => Promise<void>> = [];

  if (world && typeof world === "object") {
    const record = world as Record<string, unknown>;

    const app = record.app;
    if (isDisposable(app)) {
      disposers.push(async () => {
        await app.dispose();
      });
    }

    const container = (record.di ?? record.container) as unknown;
    if (isDisposable(container)) {
      disposers.push(async () => {
        await container.dispose();
      });
    }
  }

  return async () => {
    if (disposers.length === 0) {
      return;
    }

    const errors: unknown[] = [];
    for (const dispose of disposers) {
      try {
        await dispose();
      } catch (error) {
        errors.push(error);
      }
    }

    if (errors.length === 1) {
      throw errors[0];
    }

    if (errors.length > 1) {
      const summary = new Error(
        "Multiple errors occurred while disposing world resources"
      );
      Object.defineProperty(summary, "cause", {
        configurable: true,
        enumerable: false,
        value: errors,
      });
      throw summary;
    }
  };
}

function isDisposable(value: unknown): value is DisposableLike {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const dispose = candidate.dispose;
  return typeof dispose === "function";
}
