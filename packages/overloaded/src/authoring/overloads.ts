import { SignatureBuilder } from "./signature-builder";
import type { SignatureDefinitionInput } from "../core/signature";
import { Matcher } from "../core/matcher";
import type { OverloadHandler, ThrowsSpec, ValidatorInstance } from "../core/types";

export interface DefMetadata {
  readonly name?: string;
  readonly description?: string;
}

type ValidatorValues<T extends readonly ValidatorInstance[]> = {
  [K in keyof T]: T[K] extends ValidatorInstance<infer V> ? V : unknown;
};

type DefInput = string | DefMetadata | ValidatorInstance;
type DefContinuation = <TInputs extends readonly DefInput[]>(
  ...inputs: TInputs
) => DefBuilder<ExtractValidators<TInputs>>;

type ExtractValidators<T extends readonly unknown[]> = T extends readonly []
  ? []
  : T extends readonly [infer Head, ...infer Rest]
    ? Head extends ValidatorInstance
      ? readonly [Head, ...ExtractValidators<Rest extends readonly unknown[] ? Rest : []>]
      : Head extends string | DefMetadata
        ? ExtractValidators<Rest extends readonly unknown[] ? Rest : []>
        : ExtractValidators<Rest extends readonly unknown[] ? Rest : []>
    : [];

export interface DefBuilder<TValidators extends readonly ValidatorInstance[]> {
  match<TReturn>(handler: (...args: ValidatorValues<TValidators>) => TReturn): SignatureDefinitionInput;
  throws(error: new (message?: string) => Error, message?: string): SignatureDefinitionInput;
}

export function def(strings: TemplateStringsArray, ...placeholders: unknown[]): DefContinuation;
export function def<TInputs extends readonly DefInput[]>(...inputs: TInputs): DefBuilder<ExtractValidators<TInputs>>;
export function def(
  ...inputs: ReadonlyArray<DefInput | TemplateStringsArray | unknown>
):
  | DefBuilder<readonly ValidatorInstance[]>
  | DefContinuation {
  const [first] = inputs;

  if (isTemplateLiteral(first)) {
    const name = first[0] ?? "";
    return ((...later: readonly DefInput[]) => buildDef({ name }, later)) as DefContinuation;
  }

  return buildDef({}, inputs as readonly DefInput[]);
}

export function fallback(handler: OverloadHandler): SignatureDefinitionInput;
export function fallback(description: string, handler: OverloadHandler): SignatureDefinitionInput;
export function fallback(metadata: DefMetadata, handler: OverloadHandler): SignatureDefinitionInput;
export function fallback(
  ...args: [OverloadHandler] | [string, OverloadHandler] | [DefMetadata, OverloadHandler]
): SignatureDefinitionInput {
  const [first, maybeHandler] = args;
  let metadata: DefMetadata = {};
  let handler: OverloadHandler;

  if (typeof first === "function") {
    handler = first;
  } else if (typeof first === "string") {
    metadata = { description: first };
    handler = maybeHandler as OverloadHandler;
  } else {
    metadata = first ?? {};
    handler = maybeHandler as OverloadHandler;
  }

  if (typeof handler !== "function") {
    throw new Error("fallback requires a handler function");
  }

  const builder = SignatureBuilder.create([], metadata.name ?? "fallback", metadata.description)
    .withHandler(handler)
    .markFallback();
  return builder.build();
}

export function overloads<TDefinitions extends ReadonlyArray<SignatureDefinitionInput>>(...definitions: TDefinitions) {
  const matcher = Matcher.from(definitions);
  return {
    use(args: unknown[]) {
      return matcher.use(args);
    },
  };
}

function buildDef<TInputs extends readonly DefInput[]>(
  initialMetadata: DefMetadata,
  inputs: TInputs
): DefBuilder<ExtractValidators<TInputs>> {
  const { metadata, validators } = splitMetadataAndValidators(inputs, initialMetadata);

  if (validators.length === 0) {
    throw new Error("def requires at least one validator");
  }

  const builder = SignatureBuilder.create([...validators], metadata.name, metadata.description);

  return {
    match(handler) {
      return builder.withHandler(handler as OverloadHandler).build();
    },
    throws(errorCtor, message) {
      const spec: ThrowsSpec = message === undefined ? { error: errorCtor } : { error: errorCtor, message };
      return builder.withThrows(spec).build();
    },
  };
}

function splitMetadataAndValidators<TInputs extends readonly DefInput[]>(
  inputs: TInputs,
  initial: DefMetadata
) {
  const queue = [...inputs];
  let metadata: DefMetadata = { ...initial };

  if (queue.length > 0 && typeof queue[0] === "string") {
    const description = queue.shift() as string;
    if (description.length > 0) {
      metadata = { ...metadata, description };
    }
  }

  if (queue.length > 0 && isMetadata(queue[0])) {
    const metaArg = queue.shift() as DefMetadata;
    metadata = { ...metadata, ...metaArg };
  }

  const validators: ValidatorInstance[] = [];
  for (const candidate of queue) {
    if (!isValidator(candidate)) {
      throw new Error("def expects validators after metadata");
    }
    validators.push(candidate);
  }

  return { metadata, validators: validators as ExtractValidators<TInputs> };
}

function isValidator(value: unknown): value is ValidatorInstance {
  return Boolean(value) && typeof value === "object" && typeof (value as ValidatorInstance).validate === "function";
}

function isMetadata(value: unknown): value is DefMetadata {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (isValidator(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return "name" in candidate || "description" in candidate;
}

function isTemplateLiteral(value: unknown): value is TemplateStringsArray {
  return Array.isArray(value) && Object.prototype.hasOwnProperty.call(value, "raw");
}
