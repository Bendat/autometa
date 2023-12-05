import { AutomationError } from "./automation-error";

export function formatErrorCauses(error: AutomationError) {
  const arr: string[] = [];
  arr.push(formatError(error));
  let err = error;
  if(!('cause' in err)){
    return arr.join('');
  }
  while ('cause' in err && err?.cause) {
    const { cause } = err as { cause: AutomationError };
    if (!(cause instanceof Error)) {
      arr.push(cause);
    }
    arr.push(formatError(cause));
    err = err.cause as AutomationError;
  }
 return arr.join("\nCause:\n");
}

function formatError(error: Error) {
  return `${error.name}: ${error.message}
Stacktrace:
${error.stack}`;
}
