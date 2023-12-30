export type Class<T> = new (...args: unknown[]) => T;

export type DefaultValueMetadata =
  | {
      dtoType: Class<unknown>;
    }
  | {
      factory: (...args: unknown[]) => unknown;
    }
  | {
      value: unknown;
    };

export interface PropertyMetadata {
  [key: string]: DefaultValueMetadata;
}
