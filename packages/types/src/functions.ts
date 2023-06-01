export type TestFunction = (...args: unknown[]) => unknown;
export interface FrameworkTestCall {
  (
    title: string,
    action: (
      ...args: unknown[]
    ) => void | unknown | Promise<void | unknown> | undefined
  ): void;
  skip: (
    title: string,
    action: (
      ...args: unknown[]
    ) => void | unknown | Promise<void | unknown> | undefined
  ) => void;
  only: (
    title: string,
    action: (
      ...args: unknown[]
    ) => void | unknown | Promise<void | unknown> | undefined
  ) => void;
  concurrent?: (
    title: string,
    action: (...args: unknown[]) => void | Promise<void> | undefined
  ) => void;
}
