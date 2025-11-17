import type { StepRuntimeHelpers, RawTable } from "@autometa/executor";
import type { HeaderlessTable, HorizontalTable, VerticalTable } from "@autometa/gherkin";

export function consumeHorizontalTable(runtime: StepRuntimeHelpers): Array<Record<string, string>> {
  const table = runtime.consumeTable("horizontal") as HorizontalTable | undefined;
  if (!table) {
    return [];
  }

  return table.getRows({ raw: true }).map((row) => {
    const record: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      record[String(key)] = String(value ?? "").trim();
    }
    return record;
  });
}

export function consumeVerticalTable(runtime: StepRuntimeHelpers): Record<string, string> {
  const table = runtime.consumeTable("vertical") as VerticalTable | undefined;
  if (!table) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const record of table.getRecords({ raw: true })) {
    for (const [key, value] of Object.entries(record)) {
      result[String(key)] = String(value ?? "").trim();
    }
  }
  return result;
}

export function consumeHeaderlessTable(runtime: StepRuntimeHelpers): string[][] {
  const table = runtime.consumeTable("headerless") as HeaderlessTable | undefined;
  if (!table) {
    return [];
  }

  return table.rows({ raw: true }).map((row) => row.map((cell) => String(cell ?? "").trim()));
}

export function cloneTable(table: RawTable | undefined): string[][] {
  if (!table) {
    return [];
  }
  return table.map((row) => row.map((cell) => String(cell)));
}
