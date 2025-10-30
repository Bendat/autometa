import { AutomationError } from "@autometa/errors";
import { AssertKey } from ".";
export function AssertLength<TObj extends Array<unknown> | string>(
  item: TObj,
  length: number,
  context?: string
): asserts length is TObj["length"] {
  AssertKey(item, "length", context);
  const prefix = context ? `${context}: ` : "";
  if (item.length !== length) {
    throw new AutomationError(
      `${prefix}Array was expected to have length ${length} but was ${
        item.length
      }. Full Array: ${JSON.stringify(item, null, 2)}`
    );
  }
}
export function ConfirmLength<TObj extends Array<unknown> | string>(
  item: TObj,
  length: number
): length is TObj["length"] {
  AssertKey(item, "length");
  if (item.length !== length) {
    return false;
  }
  return true;
}
export function AssertLengthAtLeast<TObj extends Array<unknown> | string>(
  item: TObj,
  length: number,
  context?: string
) {
  AssertKey(item, "length", context);
  const prefix = context ? `${context}: ` : "";
  if (item.length < length) {
    throw new AutomationError(
      `${prefix}Array was expected to have at least length ${length} but was ${
        item.length
      }. Full Array: ${JSON.stringify(item, null, 2)}`
    );
  }
}
export function ConfirmLengthAtLeast<TObj extends Array<unknown> | string>(
  item: TObj,
  length: number
) {
  AssertKey(item, "length");
  if (item.length < length) {
    return false;
  }
  return true;
}

export function AssertLengthAtMost<TObj extends Array<unknown> | string>(
  item: TObj,
  length: number,
  context?: string
) {
  AssertKey(item, "length", context);
  const prefix = context ? `${context}: ` : "";
  if (item.length > length) {
    throw new AutomationError(
      `${prefix}Array was expected to have at least length ${length} but was ${
        item.length
      }. Full Array: ${JSON.stringify(item, null, 2)}`
    );
  }
}

export function ConfirmLengthAtMost<TObj extends Array<unknown> | string>(
  item: TObj,
  length: number
) {
  AssertKey(item, "length");
  if (item.length > length) {
    return false;
  }
  return true;
}
