export function captureError(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (...args: any[]) => any | Promise<any>,
  ...args: unknown[]
): Error | undefined | Promise<Error | undefined> {
  try {
    return action(...args);
  } catch (e) {
    return e as Error;
  }
}
