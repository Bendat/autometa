import { container } from 'tsyringe';
import { globalCache } from './global-step-cache';
import { StepMetaDataKey, DecoratedStepBlueprint } from './meta-types';

export function given(text: string) {
  console.log("decorated")
  return function (target: any, propertyKey: string) {
    const blueprints: DecoratedStepBlueprint[] =
      Reflect.getMetadata(StepMetaDataKey, target) ?? [];
    const blueprint = new DecoratedStepBlueprint(propertyKey, 'given', text);
    blueprints.push(blueprint);
    if (!Reflect.hasMetadata(StepMetaDataKey, target)) {
      Reflect.defineMetadata(StepMetaDataKey, blueprints, target);
    }
    globalCache.Targets.add(target);

  };
}

export function when(text: string) {
  return function (target: any, propertyKey: string) {
    const blueprints = Reflect.getMetadata(StepMetaDataKey, target) ?? [];
    const blueprint = new DecoratedStepBlueprint(propertyKey, 'when', text);
    blueprints.push(blueprint);
    if (!Reflect.hasMetadata(StepMetaDataKey, target)) {
      Reflect.defineMetadata(StepMetaDataKey, blueprint, target);
    }
    globalCache.Targets.add(target);
  };
}

export function then(text: string) {
  return function (target: any, propertyKey: string) {
    const blueprints = Reflect.getMetadata(StepMetaDataKey, target) ?? [];
    const blueprint = new DecoratedStepBlueprint(propertyKey, 'then', text);
    blueprints.push(blueprint);
    if (!Reflect.hasMetadata(StepMetaDataKey, target)) {
      Reflect.defineMetadata(StepMetaDataKey, blueprints, target);
    }
    globalCache.Targets.add(target);
  };
}
