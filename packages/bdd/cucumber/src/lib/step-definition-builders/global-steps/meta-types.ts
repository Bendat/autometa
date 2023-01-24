export class DecoratedStepBlueprint {
  constructor(
    public propertyKey: string,
    public stepKeyword: string,
    public stepText: string
  ) {}
}

export const StepMetaDataKey = 'meta:steps-blueprints';
