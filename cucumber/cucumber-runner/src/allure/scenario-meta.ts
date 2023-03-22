import { TableValue } from "@gherkin/datatables/table-value";

export type ScenarioMeta = {
  path?: string;
  feature?: string;
  suite?: string;
  subsuite?: string;
  example?: { readonly key: string; readonly value: TableValue }[];
};
