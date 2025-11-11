import { Argument, ParameterType } from "@cucumber/cucumber-expressions";

const transformSymbol: unique symbol = Symbol("autometa:cucumber:transform");

export type ParameterTransformFn<World> = (
  values: readonly string[] | null,
  world: World
) => unknown;

type StoredParameterTransformFn = ParameterTransformFn<unknown>;

interface AppAwareParameterType extends ParameterType<unknown> {
  [transformSymbol]?: StoredParameterTransformFn;
}

let extensionsApplied = false;

export function attachTransform<World>(
  parameterType: ParameterType<unknown>,
  transform: ParameterTransformFn<World>
) {
  (parameterType as AppAwareParameterType)[transformSymbol] =
    transform as StoredParameterTransformFn;
}

export function applyCucumberExtensions() {
  if (extensionsApplied) {
    return;
  }

  const originalTransform =
    ParameterType.prototype.transform as (
      this: ParameterType<unknown>,
      thisObj: unknown,
      groupValues: string[] | null
    ) => unknown;

  ParameterType.prototype.transform = function transform(
    this: AppAwareParameterType,
    thisObj: unknown,
    groupValues: readonly string[] | null
  ) {
    const transformFn = this[transformSymbol];
    if (transformFn) {
      return transformFn(groupValues ?? null, thisObj);
    }
    const normalized = groupValues ? [...groupValues] : [];
    return originalTransform.call(this, thisObj, normalized);
  } as unknown as typeof ParameterType.prototype.transform;

  const originalGetValue = Argument.prototype.getValue as (
    this: Argument,
    thisObj: unknown
  ) => unknown;

  Argument.prototype.getValue = function getValue<T>(
    this: Argument,
    context?: unknown
  ): T {
    const group = this.group;
    let values: readonly string[] | null = null;

    if (group) {
      const childValues = group.children
        ?.map((child: { value?: string | undefined }) => child.value)
        .filter((value: string | undefined): value is string => value !== undefined);

      if (childValues && childValues.length > 0) {
        values = childValues;
      } else if (group.value !== undefined && group.value !== null) {
        values = [group.value];
      } else if (group.values) {
        values = group.values;
      }
    }

    const parameterType = this.parameterType as AppAwareParameterType | undefined;
    const transformFn = parameterType?.[transformSymbol];
    if (transformFn) {
      return transformFn(values, context) as T;
    }

    return originalGetValue.call(this, context) as T;
  };

  extensionsApplied = true;
}
