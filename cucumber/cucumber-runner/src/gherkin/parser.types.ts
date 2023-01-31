export declare interface GherkinDocument {
  uri?: string;
  feature?: Feature;
  comments: readonly Comment[];
}
export declare class Location {
  line: number;
  column?: number;
}
export declare interface Background {
  location: Location;
  keyword: string;
  name: string;
  description: string;
  steps: readonly Step[];
  id: string;
}
export declare interface Comment {
  location: Location;
  text: string;
}
export declare interface DataTable {
  location: Location;
  rows: readonly TableRow[];
}
export declare interface DocString {
  location: Location;
  mediaType?: string;
  content: string;
  delimiter: string;
}
export declare interface Examples {
  location: Location;
  tags: readonly Tag[];
  keyword: string;
  name: string;
  description: string;
  tableHeader?: TableRow;
  tableBody: readonly TableRow[];
  id: string;
}
export declare interface Feature {
  location: Location;
  tags: readonly Tag[];
  language: string;
  keyword: string;
  name: string;
  description: string;
  children: readonly FeatureChild[];
}
export declare interface FeatureChild {
  rule?: Rule;
  background?: Background;
  scenario?: Scenario;
}
export declare interface Rule {
  location: Location;
  tags: readonly Tag[];
  keyword: string;
  name: string;
  description: string;
  children: readonly RuleChild[];
  id: string;
}
export declare interface RuleChild {
  background?: Background;
  scenario?: Scenario;
}
export declare interface Scenario {
  location: Location;
  tags: readonly Tag[];
  keyword: string;
  name: string;
  description: string;
  steps: readonly Step[];
  examples: readonly Examples[];
  id: string;
}
export declare interface Step {
  location: Location;
  keyword: string;
  keywordType?: StepKeywordType;
  text: string;
  docString?: DocString;
  dataTable?: DataTable;
  id: string;
}
export declare interface TableCell {
  location: Location;
  value: string;
}
export declare interface TableRow {
  location: Location;
  cells: readonly TableCell[];
  id: string;
}
export declare interface Tag {
  location: Location;
  name: string;
  id: string;
}
export declare enum StepKeywordType {
  UNKNOWN = "Unknown",
  CONTEXT = "Context",
  ACTION = "Action",
  OUTCOME = "Outcome",
  CONJUNCTION = "Conjunction",
}
