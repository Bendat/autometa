/**
 * World interface for the arithmetic example
 */
export interface ArithmeticWorld {
  value: number;
  result: number | undefined;
}

/**
 * Default world values
 */
export const arithmeticWorldDefaults: Partial<ArithmeticWorld> = {
  value: 0,
  result: undefined,
};
