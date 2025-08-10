const META_DATA: unique symbol = Symbol("autometa:meta-data");
const CONSTRUCTOR: unique symbol = Symbol("autometa:meta-data:constructor");
export const AutometaSymbol = {
  META_DATA,
  CONSTRUCTOR,
} as const;
