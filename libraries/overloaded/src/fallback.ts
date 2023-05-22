import { ArgumentType } from "./arguments/types";
import { Overload } from "./overload";

export function fallback<P extends ArgumentType[], K>(
  implementation: (...args: P) => K
) {
  return new Overload([], implementation, true);
}
