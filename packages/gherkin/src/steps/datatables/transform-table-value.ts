import { TableCell } from "@cucumber/messages";
import { TableValue } from "./table-value";
export function transformTableValue(value: string): TableValue;
export function transformTableValue(cell: TableCell): TableValue;
export function transformTableValue(data: TableCell | string) {
  const value = typeof data === "string" ? data : data.value;
  const asNum = Number(value);
  if (!isNaN(asNum)) {
    return asNum;
  }

  if (value === "false" || value === "true") {
    return Boolean(value);
  }
  return value;
}
