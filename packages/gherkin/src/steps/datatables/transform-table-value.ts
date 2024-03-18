import { TableCell } from "@cucumber/messages";
import { TableValue } from "./table-value";
import { Example } from "../../example";
export function transformTableValue(
  value: string,
  example?: Example
): TableValue;
export function transformTableValue(
  cell: TableCell,
  example?: Example
): TableValue;
export function transformTableValue(
  data: TableCell | string,
  example?: Example
) {
  if (example instanceof Example) {
    const value = typeof data === "string" ? data : data.value;
    const titles = Object.keys(example.table);
    const matchingTitle = titles.find((title) =>
      value.match(new RegExp(`^<${title}>$`))
    );
    if (matchingTitle) {
      const val = example.table[matchingTitle];
      return doTransformData(val);
    }
  }
  return doTransformData(data);
}

function doTransformData(data: TableCell | string) {
  const value = typeof data === "string" ? data : data.value;
  const asNum = Number(value);
  if (!isNaN(asNum)) {
    return asNum;
  }

  if (value === "false" || value === "true") {
    return value === "true";
  }
  return value;
}
