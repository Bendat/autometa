export const REGION_EXPECTATIONS = {
  East: { expected: "Golden Latte", seasonal: true },
  West: { expected: "Midnight Mocha", seasonal: true },
  North: { expected: "Flat White", seasonal: false },
  EU: { expected: "Citrus Cold Foam", seasonal: true },
  APAC: { expected: "Espresso", seasonal: false },
} as const;

export type MenuRegion = keyof typeof REGION_EXPECTATIONS;

export interface MenuExpectation {
  readonly region: MenuRegion;
  readonly beverage: string;
  readonly seasonal: boolean;
}

export function resolveExpectationByRegion(region: string): MenuExpectation | undefined {
  const key = normalizeRegion(region);
  if (!key) {
    return undefined;
  }
  const expectation = REGION_EXPECTATIONS[key];
  if (!expectation) {
    return undefined;
  }
  return {
    region: key,
    beverage: expectation.expected,
    seasonal: expectation.seasonal,
  };
}

export function resolveExpectationByBeverage(beverage: string): MenuExpectation | undefined {
  const normalized = beverage.trim().toLowerCase();
  const entry = Object.entries(REGION_EXPECTATIONS).find(([, detail]) => detail.expected.toLowerCase() === normalized);
  if (!entry) {
    return undefined;
  }
  const [region, detail] = entry;
  return {
    region: region as MenuRegion,
    beverage: detail.expected,
    seasonal: detail.seasonal,
  };
}

export function normalizeRegion(input: string | undefined): MenuRegion | undefined {
  if (!input) {
    return undefined;
  }
  const normalized = input.trim();
  if (!normalized) {
    return undefined;
  }
  const match = (Object.keys(REGION_EXPECTATIONS) as MenuRegion[]).find((region) => region.toLowerCase() === normalized.toLowerCase());
  return match;
}
