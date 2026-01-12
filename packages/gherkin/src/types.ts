/**
 * Type definitions for the Simple Gherkin format
 */

export interface SimpleLocation {
  line: number;
  column: number;
}

export interface SimpleComment {
  location: SimpleLocation;
  text: string;
}

export interface SimpleParseError {
  message: string;
  location?: SimpleLocation;
  line?: number;
  column?: number;
  source?: string;
}

/**
 * Pickle structures for test execution
 * These provide a step-centric view of scenarios for test runners
 */
export interface SimplePickleStep {
  /** Unique identifier for this step */
  id: string;
  
  /** Step text/name */
  text: string;
  
  /** Step keyword (Given, When, Then, And, But, etc.) */
  keyword: string;
  
  /** Type of keyword (given, when, then, and, but) */
  keywordType: string;
  
  /** Step categorization for execution context */
  type: 'context' | 'action' | 'outcome';
  
  /** Location information (line, column) */
  location: SimpleLocation;
  
  /** Comments associated with this step */
  comments?: string[];
  
  /** Data table attached to this step, if any */
  dataTable?: string[][];
  
  /** Doc string attached to this step, if any */
  docString?: string;

  /** Doc string media type (from the Gherkin text block), if any */
  docStringMediaType?: string;
  
  /** AST node IDs for traceability */
  astNodeIds: string[];
  
  /** Parent scenario information */
  scenario: SimplePickleScenarioRef;
  
  /** Parent feature information */
  feature: SimplePickleFeatureRef;
  
  /** Parent rule information (if step is within a rule) */
  rule?: SimplePickleRuleRef;
  
  /** Combined tags from feature, rule, and scenario */
  tags: string[];
  
  /** URI of the feature file */
  uri?: string;
  
  /** Feature language */
  language: string;
}

export interface SimplePickle {
  /** Unique identifier for this pickle (scenario execution context) */
  id: string;
  
  /** Pickle name (usually the scenario name) */
  name: string;
  
  /** Feature language */
  language: string;
  
  /** All steps for this pickle (including background steps) */
  steps: SimplePickleStep[];
  
  /** Combined tags from feature, rule, and scenario */
  tags: string[];
  
  /** URI of the feature file */
  uri?: string;
  
  /** Parent feature information */
  feature: SimplePickleFeatureRef;
  
  /** Parent scenario information */
  scenario: SimplePickleScenarioRef;
  
  /** Parent rule information (if scenario is within a rule) */
  rule?: SimplePickleRuleRef;
}

export interface SimplePickleFeatureRef {
  id: string;
  name: string;
  location: SimpleLocation;
  tags: string[];
  comments?: string[];
}

export interface SimplePickleScenarioRef {
  id: string;
  name: string;
  location: SimpleLocation;
  tags: string[];
  comments?: string[];
  type: 'scenario' | 'scenario_outline' | 'background';
}

export interface SimplePickleRuleRef {
  id: string;
  name: string;
  location: SimpleLocation;
  tags: string[];
  comments?: string[];
}

/**
 * Union type for all feature elements that can appear in a feature
 */
export type SimpleFeatureElement = SimpleScenario | SimpleScenarioOutline | SimpleRule;

export interface SimpleFeature {
  id: string;
  uri?: string;
  keyword: string;
  language: string;
  name: string;
  description?: string;
  tags: string[];
  background?: SimpleScenario;
  /** All feature elements (scenarios, scenario outlines, rules) in order */
  elements: SimpleFeatureElement[];
  comments: SimpleComment[];
  location?: SimpleLocation;
}

export interface SimpleScenario {
  id: string;
  keyword: string;
  name: string;
  description?: string;
  tags: string[];
  steps: SimpleStep[];
  location?: SimpleLocation;
}

export interface SimpleScenarioOutline {
  id: string;
  keyword: string;
  name: string;
  description?: string;
  tags: string[];
  steps: SimpleStep[];
  exampleGroups: SimpleExampleGroup[];
  // Compiled scenarios for easier querying
  compiledScenarios: SimpleCompiledScenario[];
  location?: SimpleLocation;
}

export interface SimpleExampleGroup {
  id: string;
  keyword: string;
  name?: string;
  description?: string;
  tags: string[];
  tableHeader: string[];
  tableBody: string[][];
  location?: SimpleLocation;
}

/**
 * A pre-compiled scenario from a scenario outline with interpolated values
 * This makes it easier to query and work with individual examples
 */
export interface SimpleCompiledScenario {
  id: string;
  keyword: string; // Same as parent scenario outline
  name: string; // Interpolated name
  description?: string; // Interpolated description
  tags: string[]; // Combined tags from outline and example group
  steps: SimpleStep[]; // Interpolated steps
  exampleIndex: number; // Which row in the examples table
  exampleGroupId: string; // Reference to the example group
  scenarioOutlineId: string; // Reference to the parent scenario outline
}

/**
 * Union type for rule elements (scenarios and scenario outlines)
 */
export type SimpleRuleElement = SimpleScenario | SimpleScenarioOutline;

export interface SimpleRule {
  id: string;
  keyword: string;
  name: string;
  description?: string;
  tags: string[];
  background?: SimpleScenario;
  /** All rule elements (scenarios, scenario outlines) in order */
  elements: SimpleRuleElement[];
  location?: SimpleLocation;
}

export interface SimpleStep {
  id: string;
  keyword: string;
  text: string;
  docString?: SimpleDocString;
  dataTable?: string[][];
  location?: SimpleLocation;
}

export interface SimpleDocString {
  content: string;
  mediaType?: string;
}

export interface SimpleExamples {
  keyword: string;
  name?: string;
  description?: string;
  tags: string[];
  tableHeader: string[];
  tableBody: string[][];
}

export interface QueryResult {
  path: string;
  feature?: SimpleFeature;
  rule?: SimpleRule;
  scenario?: SimpleScenario;
  scenarioOutline?: SimpleScenarioOutline;
  exampleGroup?: SimpleExampleGroup;
  step?: SimpleStep;
}

export interface QueryOptions {
  caseSensitive?: boolean;
  exactMatch?: boolean;
}

export interface TagQueryOptions extends QueryOptions {
  /**
   * Whether to match ALL tags (AND) or ANY tags (OR)
   * @default 'any'
   */
  matchMode?: 'all' | 'any';
}
