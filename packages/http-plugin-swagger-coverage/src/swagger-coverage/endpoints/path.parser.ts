export function findPath(paths: string[], desired: string) {
  for (const path of paths) {
    if (desired.includes(path)) {
      return path;
    }
    const swaggerPaths = path.split("/");
    const desiredPaths = desired.split("/");
    if (swaggerPaths.length !== desiredPaths.length) {
      continue;
    }
  }
}

export function matchPath(swaggerPaths: string[], desiredPaths: string[]) {
  if (swaggerPaths.length !== desiredPaths.length) {
    return false;
  }
  for (const [index, swaggerPath] of swaggerPaths.entries()) {
    const desiredPath = desiredPaths[index];
    if (swaggerPath === desiredPath) {
      continue;
    }
    if (swaggerPath.startsWith("{") && swaggerPath.endsWith("}")) {
      continue;
    }
    return false;
  }
  return true;
}

export function matchPathByRegex(
  swaggerPaths: string[],
  desiredPaths: RegExp[]
) {
  for (const desiredPath of desiredPaths) {
    const swaggerString = swaggerPaths.join("/");
    if (desiredPath.test(swaggerString)) {
      return true;
    }
  }
  return false;
}
