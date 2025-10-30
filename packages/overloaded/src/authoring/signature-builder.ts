import type { SignatureDefinitionInput } from "../core/signature";
import type { OverloadHandler, ThrowsSpec, ValidatorInstance } from "../core/types";

export interface SignatureBuilderState {
  readonly name?: string;
  readonly description?: string;
  readonly validators: ValidatorInstance[];
  readonly handler?: OverloadHandler;
  readonly throws?: ThrowsSpec;
  readonly fallback: boolean;
}

export class SignatureBuilder {
  private constructor(private readonly state: SignatureBuilderState) {}

  static create(validators: ValidatorInstance[], name?: string, description?: string): SignatureBuilder {
    const normalizedValidators = [...validators];

    let state: SignatureBuilderState = {
      validators: normalizedValidators,
      fallback: false,
    };

    if (name !== undefined) {
      state = { ...state, name };
    }

    if (description !== undefined) {
      state = { ...state, description };
    }

    return new SignatureBuilder(state);
  }

  withHandler(handler: OverloadHandler): SignatureBuilder {
    return new SignatureBuilder({ ...this.state, handler });
  }

  withThrows(spec: ThrowsSpec): SignatureBuilder {
    const nextState = spec.message === undefined ? { ...this.state, throws: { error: spec.error } } : { ...this.state, throws: spec };
    return new SignatureBuilder(nextState);
  }

  markFallback(): SignatureBuilder {
    return new SignatureBuilder({ ...this.state, fallback: true });
  }

  build(): SignatureDefinitionInput {
    return {
      validators: this.state.validators,
      fallback: this.state.fallback,
      ...(this.state.name ? { name: this.state.name } : {}),
      ...(this.state.description ? { description: this.state.description } : {}),
      ...(this.state.handler ? { handler: this.state.handler } : {}),
      ...(this.state.throws ? { throws: this.state.throws } : {}),
    };
  }
}
