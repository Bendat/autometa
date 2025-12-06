import { CucumberExpression, RegularExpression, ParameterTypeRegistry } from "@cucumber/cucumber-expressions";
import { createDefaultParameterTypes } from "@autometa/cucumber-expressions";
import type {
  ScopeExecutionAdapter,
  ScopeNode,
  ScenarioSummary,
  StepDefinition,
  StepExpression,
  StepKeyword,
  ParameterRegistryLike,
} from "@autometa/scopes";
import type {
  SimpleFeature,
  SimpleRule,
  SimpleScenario,
  SimpleScenarioOutline,
  SimpleStep,
} from "@autometa/gherkin";
import type {
  FeatureNode,
  QualifiedPathSegment,
  RuleNode,
  ScenarioExecution,
  ScenarioNode,
  ScenarioOutlineExample,
  ScenarioOutlineNode,
  TestPlan,
} from "../types";
import {
  createFeatureNode,
  createRuleNode,
  createScenarioNode,
  createScenarioOutlineExample,
  createScenarioOutlineNode,
} from "./nodes";
import {
  ScenarioKindKey,
  ScenarioSummaryBuckets,
  bucketScenarioSummaries,
  createSummaryKey,
  describeSummary,
} from "./summaries";
import {
  buildExampleSuffix,
  buildQualifiedName,
  buildScopeSuffix,
  cloneData,
  collectTags,
  combineSteps,
  createExampleData,
  groupCompiledScenarios,
  mergeData,
  normalizeKeyword,
  isRule,
  isScenario,
  isScenarioOutline,
} from "./utils";
import { findChildScope } from "./scope-resolution";

const FEATURE_SEGMENT_KEY = "feature";
const RULE_SEGMENT_KEY = "rule";
const EXAMPLE_SEGMENT_KEY = "Example";

export class TestPlanBuilder<World> {
  private readonly executions: ScenarioExecution<World>[] = [];
  private readonly byId = new Map<string, ScenarioExecution<World>>();
  private readonly byQualifiedName = new Map<string, ScenarioExecution<World>>();
  private readonly featureScenarios: ScenarioNode<World>[] = [];
  private readonly featureScenarioOutlines: ScenarioOutlineNode<World>[] = [];
  private readonly featureRules: RuleNode<World>[] = [];
  private readonly ruleScenarioMap = new Map<RuleNode<World>, ScenarioNode<World>[]>();
  private readonly ruleOutlineMap = new Map<RuleNode<World>, ScenarioOutlineNode<World>[]>();
  private readonly outlineExamplesMap = new Map<ScenarioOutlineNode<World>, ScenarioOutlineExample<World>[]>();
  private readonly summaryBuckets: ScenarioSummaryBuckets<World>;
  private readonly featureSegment: QualifiedPathSegment;
  private readonly parameterRegistry: ParameterTypeRegistry;
  private featureNode!: FeatureNode<World>;

  constructor(
    private readonly feature: SimpleFeature,
    private readonly featureScope: ScopeNode<World>,
    private readonly adapter: ScopeExecutionAdapter<World>
  ) {
    const summaries = adapter
      .listScenarios()
      .filter((summary) => summary.feature.id === featureScope.id);
    this.summaryBuckets = bucketScenarioSummaries(summaries);
    this.featureSegment = {
      keyword: normalizeKeyword(feature.keyword ?? FEATURE_SEGMENT_KEY),
      name: feature.name,
      suffix: buildScopeSuffix(featureScope.id),
    };
    this.parameterRegistry = resolveParameterRegistry(adapter.getParameterRegistry?.());
    createDefaultParameterTypes<unknown>()(this.parameterRegistry);
  }

  build(): TestPlan<World> {
    this.featureNode = createFeatureNode({
      feature: this.feature,
      scope: this.featureScope,
      executions: this.executions,
      scenarios: this.featureScenarios,
      outlines: this.featureScenarioOutlines,
      rules: this.featureRules,
    });

    for (const element of this.feature.elements ?? []) {
      if (isRule(element)) {
        this.processRule(element);
      } else if (isScenarioOutline(element)) {
        this.processScenarioOutline(element, undefined);
      } else if (isScenario(element)) {
        this.processScenario(element, undefined);
      }
    }

    this.ensureAllSummariesConsumed();

    return new TestPlanImpl(
      this.featureNode,
      this.executions,
      this.byId,
      this.byQualifiedName
    );
  }

  private processRule(rule: SimpleRule): void {
    const ruleScope = findChildScope(this.featureScope, "rule", rule.name);
    const qualifiedName = buildQualifiedName([
      this.featureSegment,
      {
        keyword: normalizeKeyword(rule.keyword ?? RULE_SEGMENT_KEY),
        name: rule.name,
        suffix: buildScopeSuffix(ruleScope.id),
      },
    ]);

    const ruleScenarios: ScenarioNode<World>[] = [];
    const ruleOutlines: ScenarioOutlineNode<World>[] = [];

    const ruleNode = createRuleNode<World>({
      rule,
      scope: ruleScope,
      qualifiedName,
      scenarios: ruleScenarios,
      outlines: ruleOutlines,
    });

    this.ruleScenarioMap.set(ruleNode, ruleScenarios);
    this.ruleOutlineMap.set(ruleNode, ruleOutlines);
    this.featureRules.push(ruleNode);

    for (const element of rule.elements ?? []) {
      if (isScenarioOutline(element)) {
        this.processScenarioOutline(element, ruleNode);
      } else if (isScenario(element)) {
        this.processScenario(element, ruleNode);
      }
    }
  }

  private processScenario(
    gherkinScenario: SimpleScenario,
    ruleNode: RuleNode<World> | undefined
  ): void {
    const ruleScope = ruleNode?.scope;
    const summary = this.consumeSummary(
      "scenario",
      gherkinScenario.name,
      ruleScope
    );

    if (summary.scenario.kind !== "scenario") {
      throw new Error(
        `Scope mismatch: expected scenario kind 'scenario' but received '${summary.scenario.kind}' for '${gherkinScenario.name}'`
      );
    }

    const qualifiedName = buildQualifiedName([
      this.featureSegment,
      ...(ruleNode
        ? [
            {
              keyword: normalizeKeyword(ruleNode.keyword),
              name: ruleNode.name,
              suffix: buildScopeSuffix(ruleNode.scope.id),
            } as const,
          ]
        : []),
      {
        keyword: normalizeKeyword(gherkinScenario.keyword ?? "Scenario"),
        name: gherkinScenario.name,
        suffix: buildScopeSuffix(summary.scenario.id),
      },
    ]);

    const gherkinSteps = combineSteps(
      this.feature.background?.steps,
      ruleNode?.background?.steps,
      gherkinScenario.steps
    );

    const resolvedSteps = this.resolveStepDefinitions(summary, gherkinSteps, {
      scenario: gherkinScenario.name,
      ...(ruleNode ? { rule: ruleNode.name } : {}),
    });

    const scenarioData = cloneData(summary.scenario.data);
    const scenarioNode = createScenarioNode<World>({
      id: summary.id,
      feature: this.featureNode,
      name: gherkinScenario.name,
      keyword: gherkinScenario.keyword ?? "Scenario",
      qualifiedName,
      tags: collectTags(
        this.feature.tags,
        ruleNode?.rule.tags,
        gherkinScenario.tags,
        summary.feature.tags,
        summary.scenario.tags
      ),
      mode: summary.scenario.mode,
      pending: summary.scenario.pending,
      ...(summary.scenario.pendingReason
        ? { pendingReason: summary.scenario.pendingReason }
        : {}),
      scope: summary.scenario,
      summary,
      gherkin: gherkinScenario,
      gherkinSteps,
      steps: resolvedSteps,
      ancestors: summary.ancestors,
      ...(ruleNode ? { rule: ruleNode } : {}),
      ...(summary.scenario.timeout !== undefined ? { timeout: summary.scenario.timeout } : {}),
      ...(scenarioData ? { data: scenarioData } : {}),
    });

    if (ruleNode) {
      this.getRuleScenarios(ruleNode).push(scenarioNode);
    } else {
      this.featureScenarios.push(scenarioNode);
    }

    this.registerExecution(scenarioNode);
  }

  private processScenarioOutline(
    outline: SimpleScenarioOutline,
    ruleNode: RuleNode<World> | undefined
  ): void {
    const ruleScope = ruleNode?.scope;
    const summary = this.consumeSummary(
      "scenarioOutline",
      outline.name,
      ruleScope
    );

    if (summary.scenario.kind !== "scenarioOutline") {
      throw new Error(
        `Scope mismatch: expected scenario kind 'scenarioOutline' but received '${summary.scenario.kind}' for '${outline.name}'`
      );
    }

    const outlineQualifiedName = buildQualifiedName([
      this.featureSegment,
      ...(ruleNode
        ? [
            {
              keyword: normalizeKeyword(ruleNode.keyword),
              name: ruleNode.name,
              suffix: buildScopeSuffix(ruleNode.scope.id),
            } as const,
          ]
        : []),
      {
        keyword: normalizeKeyword(outline.keyword ?? "Scenario Outline"),
        name: outline.name,
        suffix: buildScopeSuffix(summary.scenario.id),
      },
    ]);

    const outlineData = cloneData(summary.scenario.data);
    const outlineExamples: ScenarioOutlineExample<World>[] = [];

    const outlineNode = createScenarioOutlineNode<World>({
      outline,
      summary,
      scope: summary.scenario,
      keyword: outline.keyword ?? "Scenario Outline",
      name: outline.name,
      qualifiedName: outlineQualifiedName,
      tags: collectTags(
        this.feature.tags,
        ruleNode?.rule.tags,
        outline.tags,
        summary.feature.tags,
        summary.scenario.tags
      ),
      mode: summary.scenario.mode,
      pending: summary.scenario.pending,
      ...(summary.scenario.pendingReason
        ? { pendingReason: summary.scenario.pendingReason }
        : {}),
      ancestors: summary.ancestors,
      feature: this.featureNode,
      ...(summary.scenario.timeout !== undefined ? { timeout: summary.scenario.timeout } : {}),
      ...(outlineData ? { data: outlineData } : {}),
      ...(ruleNode ? { rule: ruleNode } : {}),
      examples: outlineExamples,
    });

    this.outlineExamplesMap.set(outlineNode, outlineExamples);

    if (ruleNode) {
      this.getRuleOutlines(ruleNode).push(outlineNode);
    } else {
      this.featureScenarioOutlines.push(outlineNode);
    }

    const compiledByGroup = groupCompiledScenarios(outline.compiledScenarios);

    for (const group of outline.exampleGroups ?? []) {
      const compiledForGroup = compiledByGroup.get(group.id) ?? [];
      compiledForGroup.sort((a, b) => a.exampleIndex - b.exampleIndex);

      for (const compiled of compiledForGroup) {
        const qualifiedName = buildQualifiedName([
          this.featureSegment,
          ...(ruleNode
            ? [
                {
                  keyword: normalizeKeyword(ruleNode.keyword),
                  name: ruleNode.name,
                  suffix: buildScopeSuffix(ruleNode.scope.id),
                } as const,
              ]
            : []),
          {
            keyword: normalizeKeyword(outline.keyword ?? "Scenario Outline"),
            name: outline.name,
            suffix: buildScopeSuffix(summary.scenario.id),
          },
          {
            keyword: EXAMPLE_SEGMENT_KEY,
            name: compiled.name,
            suffix: buildExampleSuffix(compiled.id, compiled.exampleIndex),
          },
        ]);

        const gherkinSteps = combineSteps(
          this.feature.background?.steps,
          ruleNode?.background?.steps,
          compiled.steps
        );

        const resolvedSteps = this.resolveStepDefinitions(summary, gherkinSteps, {
          scenario: compiled.name,
          outline: outline.name,
          ...(ruleNode ? { rule: ruleNode.name } : {}),
        });

        const exampleData = mergeData(
          cloneData(summary.scenario.data),
          createExampleData(group, compiled)
        );

        const exampleExecution = createScenarioOutlineExample<World>({
          id: compiled.id,
          feature: this.featureNode,
          outline: outlineNode,
          name: compiled.name,
          keyword: compiled.keyword ?? outline.keyword ?? "Scenario Outline",
          qualifiedName,
          tags: collectTags(
            this.feature.tags,
            ruleNode?.rule.tags,
            outline.tags,
            group.tags,
            compiled.tags,
            summary.feature.tags,
            summary.scenario.tags
          ),
          mode: summary.scenario.mode,
          pending: summary.scenario.pending,
          ...(summary.scenario.pendingReason
            ? { pendingReason: summary.scenario.pendingReason }
            : {}),
          scope: summary.scenario,
          summary,
          gherkin: compiled,
          gherkinSteps,
          steps: resolvedSteps,
          ancestors: summary.ancestors,
          exampleGroup: group,
          exampleIndex: compiled.exampleIndex,
          ...(ruleNode ? { rule: ruleNode } : {}),
          ...(summary.scenario.timeout !== undefined ? { timeout: summary.scenario.timeout } : {}),
          ...(exampleData ? { data: exampleData } : {}),
        });

        this.getOutlineExamples(outlineNode).push(exampleExecution);
        this.registerExecution(exampleExecution);
      }
    }
  }

  private consumeSummary(
    kind: ScenarioKindKey,
    scenarioName: string,
    parentScope: ScopeNode<World> | undefined
  ): ScenarioSummary<World> {
    const key = createSummaryKey(kind, scenarioName, parentScope?.id);
    const bucket = this.summaryBuckets.get(key);

    if (!bucket || bucket.length === 0) {
      throw new Error(
        `Could not find a registered ${kind} scope for '${scenarioName}'${parentScope ? ` within '${parentScope.name}'` : ""}`
      );
    }

    const summary = bucket.shift() as ScenarioSummary<World>;
    if (bucket.length === 0) {
      this.summaryBuckets.delete(key);
    }
    return summary;
  }

  private registerExecution(execution: ScenarioExecution<World>): void {
    if (this.byId.has(execution.id)) {
      throw new Error(
        `Duplicate scenario identifier detected: '${execution.id}' for '${execution.qualifiedName}'`
      );
    }
    if (this.byQualifiedName.has(execution.qualifiedName)) {
      throw new Error(
        `Duplicate qualified scenario name detected: '${execution.qualifiedName}'`
      );
    }
    this.executions.push(execution);
    this.byId.set(execution.id, execution);
    this.byQualifiedName.set(execution.qualifiedName, execution);
  }

  private ensureAllSummariesConsumed(): void {
    const leftovers: string[] = [];
    for (const bucket of this.summaryBuckets.values()) {
      for (const summary of bucket) {
        leftovers.push(describeSummary(summary));
      }
    }

    if (leftovers.length > 0) {
      throw new Error(
        `The following scope scenarios were not matched to Gherkin nodes for feature '${this.feature.name}': ${leftovers.join(", ")}`
      );
    }
  }

  private getRuleScenarios(rule: RuleNode<World>): ScenarioNode<World>[] {
    const list = this.ruleScenarioMap.get(rule);
    if (!list) {
      throw new Error(`Rule '${rule.name}' has no associated scenario registry`);
    }
    return list;
  }

  private getRuleOutlines(rule: RuleNode<World>): ScenarioOutlineNode<World>[] {
    const list = this.ruleOutlineMap.get(rule);
    if (!list) {
      throw new Error(`Rule '${rule.name}' has no associated scenario outline registry`);
    }
    return list;
  }

  private getOutlineExamples(
    outline: ScenarioOutlineNode<World>
  ): ScenarioOutlineExample<World>[] {
    const list = this.outlineExamplesMap.get(outline);
    if (!list) {
      throw new Error(
        `Scenario outline '${outline.name}' has no associated example registry`
      );
    }
    return list;
  }

  private resolveStepDefinitions(
    summary: ScenarioSummary<World>,
    gherkinSteps: readonly SimpleStep[],
    context: StepResolutionContext
  ): StepDefinition<World>[] {
    if (summary.steps.length === 0) {
      if (gherkinSteps.length === 0) {
        return [];
      }
      const missingStep = gherkinSteps[0];
      if (missingStep) {
        throw new Error(
          this.buildMissingStepDefinitionMessage(context, missingStep)
        );
      }
      return [];
    }

    const remaining = new Set(summary.steps);
    const ordered: StepDefinition<World>[] = [];
    const matchers = new Map<StepDefinition<World>, StepMatcher>();

    for (const step of gherkinSteps) {
      const matched = this.findMatchingStepDefinition(
        step,
        summary.steps,
        remaining,
        matchers
      );

      if (!matched) {
        throw new Error(this.buildMissingStepDefinitionMessage(context, step));
      }

      ordered.push(matched);
      remaining.delete(matched);
    }

    // Note: It's normal for some step definitions to remain unused in a scenario.
    // Each scenario only uses the steps it needs, so we don't throw an error for unused steps.

    return ordered;
  }

  private findMatchingStepDefinition(
    step: SimpleStep,
    definitions: readonly StepDefinition<World>[],
    remaining: Set<StepDefinition<World>>,
    matchers: Map<StepDefinition<World>, StepMatcher>
  ): StepDefinition<World> | undefined {
    const rawKeyword = normalizeKeyword(step.keyword ?? "");
    const wildcard = isFlexibleKeyword(rawKeyword);
    const keyword = wildcard ? undefined : normalizeGherkinStepKeyword(rawKeyword);

    const candidates = definitions.filter((definition) => {
      if (!remaining.has(definition)) {
        return false;
      }
      if (wildcard) {
        return true;
      }
      return keyword ? definition.keyword === keyword : false;
    });

    for (const definition of candidates) {
      if (this.matchesStepExpression(definition, step.text, matchers)) {
        return definition;
      }
    }

    return undefined;
  }

  private matchesStepExpression(
    definition: StepDefinition<World>,
    text: string,
    matchers: Map<StepDefinition<World>, StepMatcher>
  ): boolean {
    let matcher = matchers.get(definition);
    if (!matcher) {
      matcher = this.createMatcher(definition.expression);
      matchers.set(definition, matcher);
    }
    return matcher(text);
  }

  private createMatcher(expression: StepExpression): StepMatcher {
    if (expression instanceof RegExp) {
      const regex = new RegExp(expression.source, expression.flags);
      const evaluator = new RegularExpression(regex, this.parameterRegistry);
      return (text: string) => evaluator.match(text) !== null;
    }

    try {
      const cucumberExpression = new CucumberExpression(
        expression,
        this.parameterRegistry
      );
      return (text: string) => cucumberExpression.match(text) !== null;
    } catch {
      const literal = expression;
      return (text: string) => text === literal;
    }
  }

  private buildMissingStepDefinitionMessage(
    context: StepResolutionContext,
    step: SimpleStep
  ): string {
    const keyword = (step.keyword ?? "").trim();
    const display = keyword.length > 0 ? `${keyword} ${step.text}` : step.text;
    const parts = [
      `No step definition matched '${display}'`,
      `in scenario '${context.scenario}'`,
    ];
    if (context.outline) {
      parts.push(`of outline '${context.outline}'`);
    }
    if (context.rule) {
      parts.push(`within rule '${context.rule}'`);
    }
    parts.push(`for feature '${this.feature.name}'.`);
    return parts.join(" ");
  }

  private buildUnusedStepDefinitionsMessage(
    context: StepResolutionContext,
    extras: readonly string[]
  ): string {
    const segments = [
      `The following step definitions were not matched to Gherkin steps in scenario '${context.scenario}'`,
    ];
    if (context.outline) {
      segments.push(`of outline '${context.outline}'`);
    }
    if (context.rule) {
      segments.push(`within rule '${context.rule}'`);
    }
    segments.push(`for feature '${this.feature.name}': ${extras.join(", ")}`);
    return segments.join(" ");
  }

  private describeStepDefinition(definition: StepDefinition<World>): string {
    return `${definition.keyword} ${formatExpression(definition.expression)}`;
  }
}

class TestPlanImpl<World> implements TestPlan<World> {
  constructor(
    readonly feature: FeatureNode<World>,
    private readonly executions: readonly ScenarioExecution<World>[],
    private readonly byId: ReadonlyMap<string, ScenarioExecution<World>>,
    private readonly byQualifiedName: ReadonlyMap<string, ScenarioExecution<World>>
  ) {}

  listExecutables(): readonly ScenarioExecution<World>[] {
    return this.executions;
  }

  listFailed(): readonly ScenarioExecution<World>[] {
    return this.executions.filter((execution) => execution.result.status === "failed");
  }

  findById(id: string): ScenarioExecution<World> | undefined {
    return this.byId.get(id);
  }

  findByQualifiedName(name: string): ScenarioExecution<World> | undefined {
    return this.byQualifiedName.get(name);
  }
}

type StepMatcher = (text: string) => boolean;

interface StepResolutionContext {
  readonly scenario: string;
  readonly outline?: string;
  readonly rule?: string;
}

function resolveParameterRegistry(
  parameterRegistry: ParameterRegistryLike | undefined
): ParameterTypeRegistry {
  if (!parameterRegistry) {
    return new ParameterTypeRegistry();
  }
  if (isParameterTypeRegistry(parameterRegistry)) {
    return parameterRegistry;
  }
  const candidate = (parameterRegistry as { registry?: ParameterTypeRegistry }).registry;
  if (isParameterTypeRegistry(candidate)) {
    return candidate;
  }
  return new ParameterTypeRegistry();
}

function isParameterTypeRegistry(value: unknown): value is ParameterTypeRegistry {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof ParameterTypeRegistry) {
    return true;
  }
  const registry = value as ParameterTypeRegistry;
  return (
    typeof registry.lookupByTypeName === "function" &&
    typeof registry.defineParameterType === "function"
  );
}

function normalizeGherkinStepKeyword(keyword: string): StepKeyword {
  const trimmed = normalizeKeyword(keyword).replace(/:$/, "");
  const mapped = STEP_KEYWORD_MAP[trimmed.toLowerCase()];
  if (!mapped) {
    throw new Error(`Unsupported Gherkin step keyword '${keyword}'`);
  }
  return mapped;
}

function isFlexibleKeyword(keyword: string): boolean {
  const normalized = normalizeKeyword(keyword).replace(/:$/, "").toLowerCase();
  return FLEXIBLE_KEYWORDS.has(normalized);
}

function formatExpression(expression: StepExpression): string {
  return typeof expression === "string" ? expression : expression.toString();
}

const STEP_KEYWORD_MAP: Record<string, StepKeyword> = {
  given: "Given",
  when: "When",
  then: "Then",
  and: "And",
  but: "But",
};

const FLEXIBLE_KEYWORDS = new Set<string>(["and", "but", "*"]);
