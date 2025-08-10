import { ValidationError } from "../validation-error";

/**
 * An Error which indicates a DTO has failed validation.
 */
export class FailedValidationError extends Error {
  /**
   * Creates a new FailedValidatorError
   * @param msg a human friendly error message
   * @param validationErrors a list of validation errors.
   */
  constructor(msg: string, public readonly validationErrors: ValidationError[]) {
    super(msg);
  }
}
