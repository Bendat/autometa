export type StepKeyword = "Given" | "When" | "Then" | "And" | "But" | string;

export interface FeatureLocation {
  readonly featurePath: string; // repo-relative path
}

export interface StepNode {
  readonly keyword: StepKeyword;
  readonly text: string;
  readonly table?: {
    readonly headers: readonly string[];
    readonly rows: readonly (readonly string[])[];
  };
}

export interface ScenarioNode {
  readonly kind: "scenario";
  readonly name: string;
  readonly description?: string;
  readonly steps: readonly StepNode[];
  readonly tags: readonly string[];
  readonly backgroundSteps: readonly StepNode[];
}

export interface OutlineExampleTable {
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

export interface ScenarioOutlineNode {
  readonly kind: "outline";
  readonly name: string;
  readonly description?: string;
  readonly steps: readonly StepNode[];
  readonly tags: readonly string[];
  readonly backgroundSteps: readonly StepNode[];
  readonly examples: readonly OutlineExampleTable[];
}

export type FeatureChildNode = ScenarioNode | ScenarioOutlineNode;

export interface ParsedFeature {
  readonly name: string;
  readonly description?: string;
  readonly tags: readonly string[];
  readonly backgroundSteps: readonly StepNode[];
  readonly children: readonly FeatureChildNode[];
  readonly path: string; // repo-relative path
}
