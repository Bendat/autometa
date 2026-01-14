export { Matcher } from "./core/matcher";
export type {
	NormalizedSignature,
	ValidatorInstance,
	ValidationIssue,
	ValidationResult,
	ValidationPath,
	MatchScore,
	SignatureFailureReport,
	OverloadHandler,
	ThrowsSpec,
} from "./core/types";
export { normalizeDefinition, normalizeSignatures } from "./core/signature";
export type { SignatureDefinitionInput } from "./core/signature";
export { AmbiguousOverloadError, NoOverloadMatchedError } from "./core/errors";
export {
	createValidator,
	failure,
	success,
	type ValidatorOptions,
	type ValidatorRuntimeContext,
} from "./validators/base";
export { string, number, boolean, literal, unknown, func, typeOf } from "./validators/primitives";
export { array, tuple, shape, union, intersection, instanceOf } from "./validators/composite";
export { def, fallback, overloads } from "./authoring/overloads";
export { SignatureBuilder } from "./authoring/signature-builder";