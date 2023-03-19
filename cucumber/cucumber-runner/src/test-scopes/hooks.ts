import { Status } from "@cucumber/cucumber";
import { events } from "./events";
import { SetupHook, TeardownHook } from "./hook";

export async function executeSetupHooks(hooks: SetupHook[], ...args: unknown[]) {
  if (!hooks || hooks.length === 0) {
    return;
  }
  const result = Promise.all(
    hooks.map(async ({ action, description }) => {
      events.setup.emitStart({ description });
      try {
        const result = action(...args);
        events.setup.emitEnd({ description, status: Status.PASSED });
        return result;
      } catch (e: unknown) {
        if (description) {
          const error = e as Error;
          error.message = `Hook(${description}) failed with: ${error.message}`;
        }
        events.setup.emitEnd({ description, status: Status.FAILED, errors: [e] });

        throw e;
      }
    })
  );
  return result;
}

export async function executeTeardownHooks(hooks: TeardownHook[], ...args: unknown[]) {
  if (!hooks || hooks.length === 0) {
    return;
  }
  const result = Promise.all(
    hooks.map(async ({ action, description }) => {
      events.teardown.emitStart({ description });
      try {
        const result = action(...args);
        events.teardown.emitEnd({ description, status: Status.PASSED });
        return result;
      } catch (e: unknown) {
        if (description) {
          const error = e as Error;
          error.message = `Hook(${description}) failed with: ${error.message}`;
        }
        events.teardown.emitEnd({ description, status: Status.FAILED, errors: [e] });
        throw e;
      }
    })
  );
  return result;
}
