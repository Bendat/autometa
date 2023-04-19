import { closestMatch } from "closest-match";
export function assertKey<TObj>(
  item: TObj,
  key: string | keyof TObj,
  message?: string
): asserts key is keyof TObj {
  const keyStr = String(key);

  if (item === null || item === undefined) {
    throw new Error(
      `Item cannot be null or undefined if indexing for values. key: '${keyStr}'`
    );
  }
  if (!(typeof item === "object" || typeof item === "function")) {
    throw new Error(
      `A key can only be valid for a value whos type is object: ${item}. Key: '${keyStr}' is not known`
    );
  }
  if (key && typeof key == "string" && key in item) {
    return;
  }
  const matches = closestMatch(key as string, Object.keys(item), true) ?? [];
  const prefix = message ? `${message} ` : "";
  const matchStr = Array.isArray(matches) ? matches.join("\n") : matches;
  const error = `${prefix}Key ${keyStr} does not exist on target ${item}.
Did you mean: 
${matchStr}`;
  throw new Error(error);
}
