export type TestGroup = ((title: string, action: (...args: unknown[]) => void) => void) & {
  skip: (title: string, action: (...args: unknown[]) => void) => void;
  only: (title: string, action: (...args: unknown[]) => void) => void;
};
export interface FrameworkTestCall {
  (title: string, action: (...args: unknown[]) => void | Promise<void> | undefined): void;
  skip: (title: string, action: (...args: unknown[]) => void | Promise<void> | undefined) => void;
  only: (title: string, action: (...args: unknown[]) => void | Promise<void> | undefined) => void;
  concurrent?: (
    title: string,
    action: (...args: unknown[]) => void | Promise<void> | undefined
  ) => void;
}
export type TestCall = (title: string, fn: (...args: any[]) => any) => any;
export type Hook = (action: (...args: unknown[]) => void | Promise<void>) => void;

export type Modifiers = "skip" | "only";