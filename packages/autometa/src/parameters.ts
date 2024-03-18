import { ParameterTypeRegistry } from "@cucumber/cucumber-expressions";
import {
  BooleanParam,
  DateParam,
  NumberParam,
  PrimitiveParam,
  OrdinalParam,
  TextParam,
  defineParameterType as dpt,
} from "@autometa/cucumber-expressions";

export const PARAM_REGISTRY = new ParameterTypeRegistry();

/**
 * Defines a parameter type for use in step definitions.
 *
 * ```ts
 * import { Color } from '../support/color';
 *
 * defineParameterType({
 *  name: "color",
 *  regexpPattern: /red|blue|yellow/,
 *  transform: (value: string) => Color(value)
 * })
 *
 * // using regex arrays
 * defineParameterType({
 *  name: "color",
 *  regexpPattern: [/red/, /blue/, /yellow/],
 *  transform: (value: string) => Color(value)
 * })
 * ```
 */
export const defineParameterType = dpt.bind(null, PARAM_REGISTRY);

defineParameterType(
  NumberParam,
  BooleanParam,
  PrimitiveParam,
  TextParam,
  DateParam,
  OrdinalParam
);
