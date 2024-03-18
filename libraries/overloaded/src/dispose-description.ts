export function disposeDescription(args: unknown[]): string {
  if (typeof args[0] === "string") {
    return args.shift() as string;
  }
  return "";
}

export function disposeTaggedTemplate(args: unknown[]): [string, boolean] {
  if (Array.isArray(args[0])) {
    return [args[0][0], true];
  }
  return ["", false];
}
