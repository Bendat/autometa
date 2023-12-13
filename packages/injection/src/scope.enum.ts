export const INJECTION_SCOPE = {
  SINGLETON: 0,
  TRANSIENT: 1,
  CACHED: 2
} as const;

export type InjectionScope =
  (typeof INJECTION_SCOPE)[keyof typeof INJECTION_SCOPE];
