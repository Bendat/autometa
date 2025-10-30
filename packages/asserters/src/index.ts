/**
 * @autometa/asserters - Type-safe runtime assertions for Autometa
 * 
 * Provides assertion utilities that throw AutomationError on failure and
 * narrow TypeScript types on success.
 */

export { assertDefined } from "./assert-defined.js";
export { assertIs } from "./assert-is.js";
export { assertKey, confirmKey, getKey } from "./assert-key.js";
export { 
  assertLength, 
  assertMinLength, 
  assertMaxLength 
} from "./assert-length.js";
export { InvalidKeyError } from "./invalid-key-error.js";
export { lie, unsafeCast } from "./type-cast.js";
