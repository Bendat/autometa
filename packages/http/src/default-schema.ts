import isJson from "@stdlib/assert-is-json";

/**
 * Schema which does not care about data validation.
 *
 * Useful if `requireSchema` is set to true, but a specific
 * endpoints response does not matter.
 * @param data
 * @returns
 */
export function AnySchema(data: unknown) {
  return data;
}

/**
 * Schema which validates that a response is empty. This can mean
 * the data payload was `null`, `undefined` or the string `'null'`.
 *
 * Useful if `requireSchema` is set to true, but a specific
 * endpoints response should be null or not defined.
 * @param data
 * @returns
 */
export function EmptySchema(data: unknown) {
  if (data !== null && data !== undefined && data !== "null") {
    throw new Error(`Expected null but got <${typeof data}> for ${data}`);
  }
  return data === "null" ? null : data;
}

/**
 * Schema which validates a response was null.
 *
 * Useful if `requireSchema` is set to true, but a specific
 * endpoints response should be null.
 * @param data
 * @returns
 */
export function NullSchema(data: unknown) {
  if (data !== null && data !== "null") {
    throw new Error(`Expected null but got <${typeof data}> for ${data}`);
  }
  return null;
}

/**
 * Schema which validates a response was undefined.
 *
 * Useful if `requireSchema` is set to true, but a specific
 * endpoints response should be undefined.
 *
 * @param data
 * @returns
 */
export function UndefinedSchema(data: unknown) {
  if (data !== undefined) {
    throw new Error(`Expected undefined but got <${typeof data}> for ${data}`);
  }
  return undefined;
}

/**
 * Schema which validates a response was a boolean, or a string of value
 * `'true'` or `'false'`.
 *
 * Useful if `requireSchema` is set to true, but a specific
 * endpoints response should be a boolean.
 *
 * @param data
 * @returns
 */
export function BooleanSchema(data: unknown) {
  if (
    !(typeof data === "boolean") &&
    ["true", "false"].includes(String(data)) === false
  ) {
    throw new Error(`Expected boolean but got <${typeof data}> for ${data}`);
  }
  return JSON.parse(data as string);
}

/**
 * Schema which validates a response was a number, or a string of value
 * of a number.
 *
 * Useful if `requireSchema` is set to true, but a specific
 * endpoints response should be a number.
 *
 * @param data
 * @returns
 */
export function NumberSchema(data: unknown) {
  if (
    !(typeof data === "number") &&
    /^\d*\.?\d+$/.test(String(data)) === false
  ) {
    throw new Error(`Expected number but got <${typeof data}> for ${data}`);
  }
  return JSON.parse(data as string);
}

/**
 * Schema which validates a response was a string.
 *
 * Useful if `requireSchema` is set to true, but a specific
 * endpoints response should be a string.
 *
 * @param data
 * @returns
 */
export function StringSchema(data: unknown) {
  if (typeof data !== "string") {
    throw new Error(`Expected string but got <${typeof data}> for ${data}`);
  }
  return data;
}


export function JSONSchema<T = unknown>(data: unknown) {
  if(typeof data === 'object') {
    return data as T;
  }
  if (!isJson(data)) {
    throw new Error(`Expected JSON but got <${typeof data}> for ${data}`);
  }
  const result = JSON.parse(data);
  return result;
}