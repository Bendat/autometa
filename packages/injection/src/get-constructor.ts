export function getConstructor(target: unknown) {
  if (target && "constructor" in (target as object)) {
    return target.constructor;
  }
  throw new Error(`Cannot get constructor for ${target}`);
}
