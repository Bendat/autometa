import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CucumberExpression,
  ParameterTypeRegistry,
  RegularExpression,
} from "@cucumber/cucumber-expressions";
import { getEventEmitter } from "@autometa/events";
import type {
  ParameterRegistryLike,
  SourceRef,
  StepDefinition,
  StepExpression,
} from "@autometa/scopes";
import type { ScenarioExecution, ScenarioOutlineExample } from "@autometa/test-builder";
import type {
  SimpleExampleGroup,
  SimpleLocation,
  SimpleScenario,
  SimpleStep,
} from "@autometa/gherkin";
import {
  GherkinStepError,
  isGherkinStepError,
  type GherkinContextPathSegment,
  type GherkinErrorContext,
  type GherkinStepSummary,
  type SourceLocation,
} from "@autometa/errors";
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
import type {
  ScenarioRunContext,
  StepHookDetails,
  StepHookInvocationOptions,
  StepStatus,
} from "./scope-lifecycle";
import { findPickleStep } from "./events";

export type { ScenarioRunContext } from "./scope-lifecycle";

type StepArgumentMatcher<World> = (text: string, world: World) => unknown[];

interface ParameterRegistryCarrier {
  readonly registry?: ParameterTypeRegistry;
}

const matcherCache = new WeakMap<
  StepDefinition<unknown>,
  StepArgumentMatcher<unknown>
>();

export async function runScenarioExecution<World>(
  execution: ScenarioExecution<World>,
  context: ScenarioRunContext<World>
): Promise<void> {
  execution.reset();
  const eventEmitter = context.events ? getEventEmitter() : undefined;
  const pickle = context.events?.pickle;
  const { world, beforeStepHooks, afterStepHooks, invokeHooks } = context;
  const parameterRegistry = resolveParameterRegistry(context.parameterRegistry);
  const stepSummaries: GherkinStepSummary[] = [];

  try {
    const { steps, gherkinSteps } = execution;
    for (let index = 0; index < steps.length; index++) {
      const step = steps[index];
      if (!step) {
        continue;
      }
      const gherkinStep = gherkinSteps[index];
      const metadata = buildStepMetadata(execution, index);
      const stepDetails: StepHookDetails<World> = {
        index,
        definition: step,
        ...(gherkinStep ? { gherkin: gherkinStep } : {}),
      };
      const beforeOptions: StepHookInvocationOptions<World> = {
        direction: "asc",
        step: stepDetails,
      };
      await invokeHooks(beforeStepHooks, beforeOptions);

      const pickleStep = pickle && gherkinStep?.id
        ? findPickleStep(pickle, gherkinStep.id)
        : undefined;
      if (eventEmitter && pickle && pickleStep) {
        await eventEmitter.stepStarted({
          feature: pickle.feature,
          scenario: pickle.scenario,
          step: pickleStep,
          pickle,
          ...(pickle.rule ? { rule: pickle.rule } : {}),
          metadata: { index },
        });
      }

      setStepMetadata(world, metadata);
      setStepTable(world, gherkinStep?.dataTable);
      setStepDocstring(world, gherkinStep?.docString?.content);
      let status: StepStatus = "passed";
      try {
        const args = resolveStepArguments(
          step,
          gherkinStep,
          parameterRegistry,
          world
        );
        await step.handler(world, ...args);
        stepSummaries.push(createStepSummary(metadata, gherkinStep, "passed"));
      } catch (error) {
        if (isScenarioPendingError(error)) {
          status = "skipped";
          throw error;
        }
        status = "failed";
        if (eventEmitter && pickle && pickleStep) {
          await eventEmitter.errorRaised({
            error,
            phase: "step",
            feature: pickle.feature,
            scenario: pickle.scenario,
            ...(pickle.rule ? { rule: pickle.rule } : {}),
            pickle,
            metadata: { index, stepId: pickleStep.id },
          });
        }
        stepSummaries.push(createStepSummary(metadata, gherkinStep, "failed"));
        for (let remaining = index + 1; remaining < gherkinSteps.length; remaining++) {
          const remainingMetadata = buildStepMetadata(execution, remaining);
          const remainingStep = gherkinSteps[remaining];
          stepSummaries.push(
            createStepSummary(remainingMetadata, remainingStep, "skipped")
          );
        }
        throw enrichStepError(error, metadata, stepSummaries);
      } finally {
        const afterStepDetails: StepHookDetails<World> = {
          ...stepDetails,
          status,
        };
        const afterOptions: StepHookInvocationOptions<World> = {
          direction: "desc",
          step: afterStepDetails,
        };
        await invokeHooks(afterStepHooks, afterOptions);

        if (eventEmitter && pickle && pickleStep) {
          await eventEmitter.stepCompleted({
            feature: pickle.feature,
            scenario: pickle.scenario,
            step: pickleStep,
            pickle,
            ...(pickle.rule ? { rule: pickle.rule } : {}),
            metadata: { index, status },
          });
        }

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
  }
}

function resolveStepArguments<World>(
  definition: StepDefinition<World>,
  gherkinStep: SimpleStep | undefined,
  registry: ParameterTypeRegistry,
  world: World
): unknown[] {
  if (!gherkinStep) {
    return [];
  }
  const matcher = getStepArgumentMatcher(definition, registry);
  return matcher(gherkinStep.text, world);
}

function getStepArgumentMatcher<World>(
  definition: StepDefinition<World>,
  registry: ParameterTypeRegistry
): StepArgumentMatcher<World> {
  const cached = matcherCache.get(definition as StepDefinition<unknown>);
  if (cached) {
    return cached as StepArgumentMatcher<World>;
  }
  const matcher = createStepArgumentMatcher<World>(
    definition.expression,
    registry
  );
  matcherCache.set(
    definition as StepDefinition<unknown>,
    matcher as StepArgumentMatcher<unknown>
  );
  return matcher;
}

function createStepArgumentMatcher<World>(
  expression: StepExpression,
  registry: ParameterTypeRegistry
): StepArgumentMatcher<World> {
  if (expression instanceof RegExp) {
    const evaluator = new RegularExpression(expression, registry);
    return (text, world) =>
      collectArguments(evaluator.match(text), world, text, expression);
  }
  const evaluator = new CucumberExpression(expression, registry);
  return (text, world) =>
    collectArguments(evaluator.match(text), world, text, expression);
}

function collectArguments<World>(
  match:
    | readonly { getValue(context?: unknown): unknown }[]
    | null,
  world: World,
  text: string,
  expression: StepExpression
): unknown[] {
  if (!match) {
    throw new Error(
      `Step '${text}' did not match expression ${String(expression)}`
    );
  }
  return match.map((argument) => argument.getValue(world));
}

function resolveParameterRegistry(
  source: ParameterRegistryLike | undefined
): ParameterTypeRegistry {
  if (isParameterTypeRegistry(source)) {
    return source;
  }

  const carrier = source as ParameterRegistryCarrier | undefined;
  const registry = carrier?.registry;
  if (isParameterTypeRegistry(registry)) {
    return registry;
  }

  return new ParameterTypeRegistry();
}

function isParameterTypeRegistry(
  value: unknown
): value is ParameterTypeRegistry {
  if (!value || typeof value !== "object") {
    return false;
  }

  if (value instanceof ParameterTypeRegistry) {
    return true;
  }

  const registry = value as ParameterTypeRegistry & {
    lookupByRegexp?: unknown;
  };

  return (
    typeof registry.lookupByTypeName === "function" &&
    typeof registry.defineParameterType === "function" &&
    typeof registry.lookupByRegexp === "function"
  );
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
        const definitionSource = normalizeDefinitionSource(stepDefinition.source);
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

function normalizeDefinitionSource(source: SourceRef | undefined): SourceRef | undefined {
  if (!source) {
    return undefined;
  }

  return {
    ...(source.file !== undefined ? { file: source.file } : {}),
    ...(source.line !== undefined ? { line: source.line } : {}),
    ...(source.column !== undefined ? { column: source.column } : {}),
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

function enrichStepError(
  error: unknown,
  metadata: StepRuntimeMetadata | undefined,
  steps?: readonly GherkinStepSummary[]
): Error {
  const base = error instanceof Error ? error : new Error(String(error));

  if (isGherkinStepError(base)) {
    return base;
  }

  const wrapped = new GherkinStepError(base.message, {
    cause: base,
    context: buildGherkinErrorContext(metadata, base, steps) ?? {},
  });

  if (base.stack) {
    Object.defineProperty(wrapped, "stack", {
      configurable: true,
      enumerable: false,
      writable: true,
      value: base.stack,
    });
  }

  return wrapped;
}

function buildGherkinErrorContext(
  metadata: StepRuntimeMetadata | undefined,
  error?: Error,
  steps?: readonly GherkinStepSummary[]
): GherkinErrorContext | undefined {
  if (!metadata) {
    return undefined;
  }

  const gherkinLocation = toSourceLocation(metadata.step?.source);
  const definitionLocation = toSourceLocation(metadata.definition?.source);
  const errorLocation = extractErrorLocation(error);
  const pathSegments = buildGherkinPath(metadata);

  const gherkinSegment = gherkinLocation
    ? {
        location: gherkinLocation,
        ...(metadata.feature?.name !== undefined
          ? { featureName: metadata.feature.name }
          : {}),
        ...(metadata.step?.keyword !== undefined
          ? { stepKeyword: metadata.step.keyword }
          : {}),
        ...(metadata.step?.text !== undefined ? { stepText: metadata.step.text } : {}),
      }
    : undefined;

  const expression = metadata.definition?.expression;
  const functionName =
    typeof expression === "string"
      ? expression
      : expression !== undefined
        ? String(expression)
        : undefined;

  const codeLocation = errorLocation ?? definitionLocation;

  const codeSegment = codeLocation
    ? {
        location: codeLocation,
        ...(functionName !== undefined ? { functionName } : {}),
      }
    : undefined;

  const hasSteps = Boolean(steps && steps.length > 0);

  if (!gherkinSegment && !codeSegment && !pathSegments && !hasSteps) {
    return undefined;
  }

  return {
    ...(gherkinSegment ? { gherkin: gherkinSegment } : {}),
    ...(codeSegment ? { code: codeSegment } : {}),
    ...(pathSegments ? { path: pathSegments } : {}),
    ...(hasSteps && steps ? { steps } : {}),
  };
}

function createStepSummary(
  metadata: StepRuntimeMetadata | undefined,
  gherkinStep: SimpleStep | undefined,
  status: GherkinStepSummary["status"]
): GherkinStepSummary {
  const keyword = metadata?.step?.keyword ?? gherkinStep?.keyword;
  const text = metadata?.step?.text ?? gherkinStep?.text;
  const location = metadata?.step?.source
    ? toSourceLocation(metadata.step.source)
    : undefined;

  return {
    status,
    ...(keyword !== undefined ? { keyword } : {}),
    ...(text !== undefined ? { text } : {}),
    ...(location ? { location } : {}),
  } satisfies GherkinStepSummary;
}

function buildGherkinPath(
  metadata: StepRuntimeMetadata | undefined
): GherkinContextPathSegment[] | undefined {
  if (!metadata) {
    return undefined;
  }

  const segments: GherkinContextPathSegment[] = [];

  const featureLocation = toSourceLocation(metadata.feature?.source);
  if (featureLocation) {
    segments.push({
      role: "feature",
      location: featureLocation,
      ...(metadata.feature?.keyword !== undefined
        ? { keyword: metadata.feature.keyword }
        : {}),
      ...(metadata.feature?.name !== undefined ? { name: metadata.feature.name } : {}),
    });
  }

  const outlineLocation = toSourceLocation(metadata.outline?.source);
  if (outlineLocation) {
    segments.push({
      role: "outline",
      location: outlineLocation,
      ...(metadata.outline?.keyword !== undefined
        ? { keyword: metadata.outline.keyword }
        : {}),
      ...(metadata.outline?.name !== undefined ? { name: metadata.outline.name } : {}),
    });
  }

  const scenarioLocation = toSourceLocation(metadata.scenario?.source);
  if (scenarioLocation) {
    segments.push({
      role: "scenario",
      location: scenarioLocation,
      ...(metadata.scenario?.keyword !== undefined
        ? { keyword: metadata.scenario.keyword }
        : {}),
      ...(metadata.scenario?.name !== undefined ? { name: metadata.scenario.name } : {}),
    });
  }

  const exampleLocation = toSourceLocation(metadata.example?.source);
  if (exampleLocation) {
    segments.push({
      role: "example",
      keyword: "Example",
      location: exampleLocation,
      ...(metadata.example?.name !== undefined ? { name: metadata.example.name } : {}),
      ...(metadata.example?.index !== undefined ? { index: metadata.example.index } : {}),
    });
  }

  const stepLocation = toSourceLocation(metadata.step?.source);
  if (stepLocation) {
    segments.push({
      role: "step",
      location: stepLocation,
      ...(metadata.step?.keyword !== undefined ? { keyword: metadata.step.keyword } : {}),
      ...(metadata.step?.text !== undefined ? { text: metadata.step.text } : {}),
    });
  }

  return segments.length ? segments : undefined;
}

interface ParsedStackFrame {
  readonly file: string;
  readonly line: number;
  readonly column: number;
}

const STACK_FRAME_IGNORE_PATTERNS: readonly RegExp[] = [
  /^node:/,
  /node:internal\//,
  /internal\/(?:modules|process)/,
  /node_modules\/@autometa\//,
  /packages\/(?:runner|executor|errors|cli|assertions)\//,
  /\/\.autometa-cli\/cache\//,
  /\/\.autometa\/cache\//,
  /\/node_modules\/\.cache\/autometa\//,
];

function extractErrorLocation(error: Error | undefined): SourceLocation | undefined {
  if (!error?.stack) {
    return undefined;
  }

  const lines = error.stack.split("\n").slice(1);
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed.startsWith("at ")) {
      continue;
    }
    const parsed = parseStackFrame(trimmed);
    if (!parsed) {
      continue;
    }
    if (isFrameworkStackFile(parsed.file)) {
      continue;
    }
    const filePath = normalizeFilePath(parsed.file);
    return {
      filePath,
      start: {
        line: parsed.line,
        column: parsed.column,
      },
    } satisfies SourceLocation;
  }

  return undefined;
}

function parseStackFrame(line: string): ParsedStackFrame | undefined {
  const match = line.match(/at (?:.+?\()?((?:[a-zA-Z]:)?[^():]+):(\d+):(\d+)\)?$/);
  if (!match) {
    return undefined;
  }

  const [, file = "", lineText = "", columnText = ""] = match;
  if (!file || !lineText) {
    return undefined;
  }

  const lineNumber = Number.parseInt(lineText, 10);
  if (Number.isNaN(lineNumber)) {
    return undefined;
  }

  const columnNumber = Number.parseInt(columnText, 10);

  return {
    file,
    line: lineNumber,
    column: Number.isNaN(columnNumber) ? 1 : columnNumber,
  };
}

function isFrameworkStackFile(file: string): boolean {
  const normalized = file.replace(/\\/g, "/");
  return STACK_FRAME_IGNORE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function toSourceLocation(source: SourceRef | undefined): SourceLocation | undefined {
  if (!source?.file) {
    return undefined;
  }

  const filePath = normalizeFilePath(source.file);
  const line = source.line ?? 1;
  const column = source.column ?? 1;

  return {
    filePath,
    start: {
      line,
      column,
    },
  };
}

function normalizeFilePath(file: string): string {
  if (file.startsWith("file://")) {
    try {
      return fileURLToPath(file);
    } catch {
      // fall back to treating the URI as a plain path
      return file;
    }
  }
  return path.isAbsolute(file) ? file : path.resolve(file);
}
