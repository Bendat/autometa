export function ConfirmKey<TObj>(
  item: TObj,
  key: string | keyof TObj
): key is keyof TObj {
  if (item === null || item === undefined) {
    return false;
  }
  if (!(typeof item === "object" || typeof item === "function")) {
    return false;
  }
  if (key && typeof key == "string" && key in item) {
    return true;
  }
  return false;
}
