import type { NormalizedSignature, OverloadHandler, ThrowsSpec, ValidatorInstance } from "./types";

export interface SignatureDefinition {
  readonly name?: string;
  readonly description?: string;
  readonly validators: ReadonlyArray<ValidatorInstance>;
  readonly handler?: OverloadHandler;
  readonly throws?: ThrowsSpec;
  readonly fallback?: boolean;
}

export function normalizeSignatures(definitions: ReadonlyArray<SignatureDefinition>): NormalizedSignature[] {
  return definitions.map((definition, index) => normalizeSignature(definition, index));
}

function normalizeSignature(definition: SignatureDefinition, id: number): NormalizedSignature {
  const validators = [...definition.validators];
  const fallback = definition.fallback ?? false;
  const requiredArity = countRequired(validators);
  const minArity = fallback ? 0 : requiredArity;
  const maxArity = validators.length;
  const specificity = validators.reduce(sumSpecificity, 0);

  return {
    id,
    validators,
    minArity,
    requiredArity,
    maxArity,
    specificity,
    fallback,
    ...(definition.name !== undefined ? { name: definition.name } : {}),
    ...(definition.description !== undefined ? { description: definition.description } : {}),
    ...(definition.handler !== undefined ? { handler: definition.handler } : {}),
    ...(definition.throws !== undefined ? { throws: definition.throws } : {}),
  };
}

function countRequired(validators: ReadonlyArray<ValidatorInstance>): number {
  return validators.reduce((count, validator) => (validator.optional ? count : count + 1), 0);
}

function sumSpecificity(total: number, validator: ValidatorInstance): number {
  return total + validator.specificity;
}

export function normalizeDefinition(definition: SignatureDefinition, id = 0): NormalizedSignature {
  return normalizeSignature(definition, id);
}

export type { SignatureDefinition as SignatureDefinitionInput };
