import { ParameterTypeRegistry } from "@cucumber/cucumber-expressions";
import {
  BooleanParam,
  DateParam,
  NumberParam,
  PrimitiveParam,
  TextParam,
  defineParameterType as dpt
} from "@autometa/cucumber-expressions";

export const PARAM_REGISTRY = new ParameterTypeRegistry();

export const defineParameterType = dpt.bind(null, PARAM_REGISTRY);

defineParameterType(
  NumberParam,
  BooleanParam,
  PrimitiveParam,
  TextParam,
  DateParam
);
