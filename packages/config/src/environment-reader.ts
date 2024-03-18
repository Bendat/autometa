export class EnvironmentReader {
  #envVar?: string;
  #factory?: () => string;
  #literal?: string;
  /**
   * Returns the configuration object for the selected
   * environment by weighting.
   *
   * By priority the environment is selected by:
   * 1. Literal
   * 2. Environment Variable
   * 3. Factory
   */
  get value() {
    if (this.#literal) {
      return this.#literal;
    }
    if (this.#envVar) {
      const value = process.env[this.#envVar];
      if (value) {
        return value;
      }
    }
    if (this.#factory) {
      return this.#factory();
    }
  }

  byEnvironmentVariable(envVar: string) {
    this.#envVar = envVar;
    return this;
  }
  byFactory(factory: () => string) {
    this.#factory = factory;
    return this;
  }
  byLiteral(literal: string) {
    this.#literal = literal;
    return this;
  }
}
