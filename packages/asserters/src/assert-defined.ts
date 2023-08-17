import { AutomationError } from "@autometa/errors";

export function AssertDefined<TObj>(
  item: TObj | null | undefined
): asserts item is TObj {
  if (item === null || item === undefined) {
    throw new AutomationError(
      `Item was expected to be defined but was ${item}. Full Item: ${JSON.stringify(
        item,
        null,
        2
      )}`
    );
  }
}
export function ConfirmDefined<TObj>(
  item: TObj | null | undefined
): item is TObj {
  if (item === null || item === undefined) {
    return false;
  }
  return true;
}
