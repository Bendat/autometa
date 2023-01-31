import { Hook } from "./hook";

export async function executeHooks(hooks: Hook[], ...args: unknown[]) {
  const result = Promise.all(
    hooks.map(({ action, description }) => {
      try {
        return action(...args);
      } catch (e: unknown) {
        if (description) {
          const error = e as Error;
          error.message = `Hook(${description}) failed with: ${error.message}`;
        }
        throw e;
      }
    })
  );
  return result;
}
