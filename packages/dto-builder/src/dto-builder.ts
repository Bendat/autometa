import {
  BuilderFactory,
  ClassBuilderOptions,
  ClassConstructor,
  InterfaceBuilderOptions,
} from "./types";
import { createBuilderFactory } from "./builder-factory";
import {
  collectDecoratorBlueprint,
  createManualDefaultsBlueprint,
  createValidatorBlueprint,
  resolveBuilderConfig,
} from "./metadata";

export const DtoBuilder = {
  forInterface<T>(options: InterfaceBuilderOptions<T> = {}): BuilderFactory<T> {
    const config = resolveBuilderConfig<T>({
      createTarget: (): T => ({} as T),
      blueprints: [
        createManualDefaultsBlueprint(options.defaults),
        createValidatorBlueprint(options.validator),
      ],
    });
    return createBuilderFactory(config);
  },
  forClass<T extends object>(
    ctor: ClassConstructor<T>,
    options: ClassBuilderOptions<T> = {}
  ): BuilderFactory<T> {
    const config = resolveBuilderConfig<T>({
      createTarget: () => new ctor(),
      blueprints: [
        collectDecoratorBlueprint(ctor),
        createManualDefaultsBlueprint(options.defaults),
        createValidatorBlueprint(options.validator),
      ],
    });
    return createBuilderFactory(config);
  },
};
