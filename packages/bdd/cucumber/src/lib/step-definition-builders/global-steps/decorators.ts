import { globalCache } from './global-steps';

class DecoratedStepBlueprint {
  constructor(
    public propertyKey: string,
    public stepKeyword: string,
    public stepText: string
  ) {}
}

const reflectionStore: DecoratedStepBlueprint[] = [];

function given(text: string) {
  return function (target: any, propertyKey: string) {
    const blueprint = new DecoratedStepBlueprint(propertyKey, 'given', text);
    Reflect.defineMetadata(propertyKey, blueprint, target);
    globalCache.Targets.add(target);
  };
}

function when(text: string) {
  return function (target: any, propertyKey: string) {
    const blueprint = new DecoratedStepBlueprint(propertyKey, 'given', text);
    Reflect.defineMetadata(propertyKey, blueprint, target);
    globalCache.Targets.add(target);
  };
}

function then(text: string) {
  return function (target: any, propertyKey: string) {
    const blueprint = new DecoratedStepBlueprint(propertyKey, 'given', text);
    Reflect.defineMetadata(propertyKey, blueprint, target);
    globalCache.Targets.add(target);
  };
}

export class Foo {
  @given('a foo')
  givenAFoo() {
    console.log('was given a foo');
  }
}
