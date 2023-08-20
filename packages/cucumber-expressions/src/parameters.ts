import {
  Argument,
  ParameterType,
  ParameterTypeRegistry
} from "@cucumber/cucumber-expressions";
import { Class } from "@autometa/types";
import {
  def,
  func,
  instance,
  overloads,
  string,
  nil,
  array
} from "@autometa/overloaded";
Argument.prototype.getValue = function (thisObj: unknown) {
  const groupValues = this.group
    ? this.group.value
      ? [this.group.value]
      : this.group.values
    : null;
  return this.parameterType.transform(thisObj, groupValues);
};
type PrimitiveConstructor =
  | typeof Number
  | typeof String
  | typeof Boolean
  | typeof BigInt;

export type ParamTypeDefinition = {
  name: string;
  regexpPattern: RegExp | RegExp[];
  transform?: (value: unknown) => unknown;
  type?: Class<unknown>;
  primitive?: typeof String | typeof Number | typeof Boolean | typeof BigInt;
};

const regexp = instance(RegExp).or(array([instance(RegExp)]));

export function defineParameterType<T extends ParamTypeDefinition[]>(
  registry: ParameterTypeRegistry,
  ...params: T
) {
  params.forEach((param) => {
    const { name, regexpPattern, transform, type, primitive } =
      param as ParamTypeDefinition;
    return registerParameterType(
      registry,
      name,
      regexpPattern,
      transform,
      type,
      primitive
    );
  });
}
function registerParameterType(
  registry: ParameterTypeRegistry,
  name: string,
  regexpPattern: RegExp | RegExp[],
  transform: ((value: unknown) => unknown) | undefined,
  type: Class<unknown> | undefined,
  primitive:
    | NumberConstructor
    | StringConstructor
    | BooleanConstructor
    | BigIntConstructor
    | undefined
): void {
  return overloads(
    def(
      string(),
      regexp,
      func("type"),
      func("transform"),
      func("primitive")
    ).matches((name, regexp, type, transform, primitive) => {
      const primitivePrototype = primitive as unknown as PrimitiveConstructor;
      const typePrototype = type as unknown as Class<unknown>;
      const wrapper = (val: unknown) => {
        const asPrimitive = primitivePrototype(val);
        const asType = new typePrototype(asPrimitive);
        return transform(asType);
      };
      const param = new ParameterType(name, regexp, type, wrapper);
      registry.defineParameterType(param);
    }),
    def`allTransforms`(
      string(),
      instance(RegExp),
      func("type"),
      func("transform"),
      nil("primitive")
    ).matches((name, regexp, type, transform) => {
      const typePrototype = type as unknown as Class<unknown>;
      const wrapper = (val: unknown) => {
        const asType = new typePrototype(val);
        return transform(asType);
      };
      const param = new ParameterType(name, regexp, type, wrapper);
      registry.defineParameterType(param);
    }),
    def`transformPrimitive`(
      string(),
      instance(RegExp),
      nil("type"),
      func("transform"),
      func("primitive")
    ).matches((name, regexp, _, transform, primitive) => {
      const primitivePrototype = primitive as unknown as PrimitiveConstructor;
      const wrapper = (val: unknown) => {
        const asPrimitive = primitivePrototype(val);
        return transform(asPrimitive);
      };
      const param = new ParameterType(name, regexp, primitive, wrapper);
      registry.defineParameterType(param);
    }),
    def`encapsulatePrimitive`(
      string(),
      instance(RegExp),
      func("type"),
      nil("transform"),
      func("primitive")
    ).matches((name, regexp, type, _, primitive) => {
      const primitivePrototype = primitive as unknown as PrimitiveConstructor;
      const typePrototype = type as unknown as Class<unknown>;
      const wrapper = (val: unknown) => {
        const asPrimitive = primitivePrototype(val);
        return new typePrototype(asPrimitive);
      };
      const param = new ParameterType(name, regexp, type, wrapper);
      registry.defineParameterType(param);
    }),
    def`makeType`(
      string(),
      instance(RegExp),
      func("type"),
      nil(),
      nil()
    ).matches((name, pattern, type) => {
      const prototype = type as unknown as Class<unknown>;
      const transform = (val: unknown) => new prototype(val);
      const param = new ParameterType(name, pattern, null, transform);
      registry.defineParameterType(param);
    }),
    def`makePrimitive`(
      string(),
      instance(RegExp),
      nil(),
      nil(),
      func("primitive")
    ).matches((name, pattern, _, __, primitive) => {
      const prototype = primitive as unknown as PrimitiveConstructor;
      const transform = (val: unknown) => prototype(val);
      const param = new ParameterType(name, pattern, null, transform);
      registry.defineParameterType(param);
    }),
    def`transformValue`(
      string(),
      instance(RegExp),
      nil(),
      func("transform"),
      nil()
    ).matches((name, pattern, _, transform, __) => {
      const param = new ParameterType(name, pattern, null, transform);
      registry.defineParameterType(param);
    }),
    def`default`(string(), instance(RegExp), nil(), nil(), nil()).matches(
      (name, pattern, _, __, ___) => {
        const transform = (val: unknown) => val;
        const param = new ParameterType(name, pattern, null, transform);
        registry.defineParameterType(param);
      }
    )
  ).use([name, regexpPattern, type, transform, primitive]);
}
