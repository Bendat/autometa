const global = Symbol.for("autometa:container:global");

export function defineContainerContext(name: string) {
  if (name === "global") {
    return global;
  }
  const hash = name.replace(/\s/g, "-").toLowerCase();
  return Symbol.for(`autometa:container:${hash}`);
}
