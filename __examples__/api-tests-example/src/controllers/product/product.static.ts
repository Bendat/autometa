export const ProductIdMap = {
  "iPhone 9": 1,
} as const;

export type ProductId = (typeof ProductIdMap)[keyof typeof ProductIdMap];
