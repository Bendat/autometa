export async function captureError(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (...args: any[]) => any | Promise<any>,
  ...args: unknown[]
): Promise<Error | undefined> {
  try {
    await action(...args);
  } catch (e) {
    return e as Error;
  }
}
