export type StepKeyword = "Given" | "When" | "Then" | "And" | "But" | string;

export interface FeatureLocation {
  readonly featurePath: string; // repo-relative path
}

export interface RuleNode {
  readonly name: string;
  /** 1-based line number of the `Rule:` line in the source file (best-effort). */
  readonly line?: number;
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
  /** 1-based line number of the `Scenario:` line in the source file (best-effort). */
  readonly line?: number;
  readonly rule?: RuleNode;
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
  /** 1-based line number of the `Scenario Outline:` line in the source file (best-effort). */
  readonly line?: number;
  readonly rule?: RuleNode;
  readonly description?: string;
  readonly steps: readonly StepNode[];
  readonly tags: readonly string[];
  readonly backgroundSteps: readonly StepNode[];
  readonly examples: readonly OutlineExampleTable[];
}

/**
 * Represents a single row from a scenario outline's Examples table.
 * Generated when outline-is=section to create individual test cases per row.
 */
export interface OutlineRowNode {
  readonly kind: "outline-row";
  /** Interpolated name with placeholders replaced by row values. */
  readonly name: string;
  /** Line number of the Examples row in the source file (best-effort). */
  readonly line?: number;
  readonly rule?: RuleNode;
  readonly description?: string;
  /** Steps with placeholders replaced by row values. */
  readonly steps: readonly StepNode[];
  readonly tags: readonly string[];
  readonly backgroundSteps: readonly StepNode[];
  /** Reference to the parent outline this row came from. */
  readonly parentOutline: ScenarioOutlineNode;
  /** Index of the Examples table within the outline (0-based). */
  readonly exampleIndex: number;
  /** Index of the row within the Examples table (0-based). */
  readonly rowIndex: number;
  /** Actual values from this row. */
  readonly rowValues: readonly string[];
}

export type FeatureChildNode = ScenarioNode | ScenarioOutlineNode | OutlineRowNode;

export interface ParsedFeature {
  readonly name: string;
  readonly description?: string;
  readonly tags: readonly string[];
  readonly backgroundSteps: readonly StepNode[];
  readonly children: readonly FeatureChildNode[];
  readonly path: string; // repo-relative path
}
