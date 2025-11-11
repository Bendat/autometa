import { Argument, ParameterType } from "@cucumber/cucumber-expressions";

const transformSymbol: unique symbol = Symbol("autometa:cucumber:transform");

export interface ParameterRuntime<World> {
  readonly world: World;
  readonly parameterType: ParameterType<unknown>;
}

export type ParameterTransformFn<World> = (
  values: readonly string[] | null,
  runtime: ParameterRuntime<World>
) => unknown;

type StoredParameterTransformFn = ParameterTransformFn<unknown>;

interface AppAwareParameterType extends ParameterType<unknown> {
  [transformSymbol]?: StoredParameterTransformFn;
}

let extensionsApplied = false;
let originalTransform: typeof ParameterType.prototype.transform | undefined;
let originalGetValue: typeof Argument.prototype.getValue | undefined;

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

  originalTransform = originalTransform ?? ParameterType.prototype.transform;

  ParameterType.prototype.transform = function transform(
    this: AppAwareParameterType,
    thisObj: unknown,
    groupValues: readonly string[] | null
  ) {
    const transformFn = this[transformSymbol];
    if (transformFn) {
      return transformFn(groupValues ?? null, {
        world: thisObj,
        parameterType: this,
      });
    }
    const normalized = groupValues ? [...groupValues] : [];
    if (!originalTransform) {
      throw new Error("Cucumber extensions have not been initialised correctly");
    }
    return originalTransform.call(this, thisObj, normalized);
  } as unknown as typeof ParameterType.prototype.transform;

  originalGetValue = originalGetValue ?? (Argument.prototype.getValue as typeof Argument.prototype.getValue);

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
    if (transformFn && parameterType) {
      return transformFn(values, {
        world: context as unknown,
        parameterType,
      }) as T;
    }

    if (!originalGetValue) {
      throw new Error("Cucumber extensions have not been initialised correctly");
    }

    return originalGetValue.call(this, context) as T;
  };

  extensionsApplied = true;
}

export function resetCucumberExtensions() {
  if (!extensionsApplied) {
    return;
  }

  if (originalTransform) {
    ParameterType.prototype.transform = originalTransform;
  }

  if (originalGetValue) {
    Argument.prototype.getValue = originalGetValue;
  }

  extensionsApplied = false;
}
