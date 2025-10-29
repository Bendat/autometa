/**
 * Extracts the element type from the given array or tuple type.
 */
export type ElementOf<ArrayType> = ArrayType extends readonly (infer ElementType)[]
  ? ElementType
  : never;

/**
 * @deprecated Use {@link ElementOf} instead.
 */
export type ArrayElement<ArrayType> = ElementOf<ArrayType>;
