import { generatePickleById } from "@autometa/gherkin";
import type {
  SimpleFeature,
  SimplePickle,
  SimplePickleFeatureRef,
  SimplePickleRuleRef,
  SimplePickleStep,
  SimpleRule,
} from "@autometa/gherkin";

export function createFeatureRef(feature: SimpleFeature): SimplePickleFeatureRef {
  return {
    id: feature.id,
    name: feature.name,
    location: feature.location ?? { line: 1, column: 1 },
    tags: feature.tags,
    comments: feature.comments?.map((comment) => comment.text),
  };
}

export function createRuleRef(rule: SimpleRule): SimplePickleRuleRef {
  return {
    id: rule.id,
    name: rule.name,
    location: rule.location ?? { line: 1, column: 1 },
    tags: rule.tags,
  };
}

export function requirePickle(feature: SimpleFeature, scenarioId: string): SimplePickle {
  const pickle = generatePickleById(feature, scenarioId);
  if (!pickle) {
    throw new Error(
      `Unable to generate pickle for scenario "${scenarioId}". Ensure the feature contains compiled scenarios and stable ids.`
    );
  }
  return pickle;
}

export function findPickleStep(
  pickle: SimplePickle,
  stepId: string
): SimplePickleStep | undefined {
  return pickle.steps.find((step) => step.id === stepId || step.astNodeIds?.includes(stepId));
}

