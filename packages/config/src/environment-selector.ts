export type EnvironmentFactory = () => string | undefined;

const sanitize = (value: string | undefined | null) => {
  if (value == null) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

export class EnvironmentSelector {
  private readonly detectors: EnvironmentFactory[] = [];
  private fallback = "default";

  byLiteral(name: string): this {
    this.detectors.push(() => sanitize(name));
    return this;
  }

  byEnvironmentVariable(variable: string): this {
    this.detectors.push(() => sanitize(process.env[variable]));
    return this;
  }

  byFactory(factory: EnvironmentFactory): this {
    this.detectors.push(() => sanitize(factory()));
    return this;
  }

  defaultTo(name: string): this {
    const sanitized = sanitize(name);
    if (!sanitized) {
      throw new Error("Default environment name must be a non-empty string");
    }
    this.fallback = sanitized;
    return this;
  }

  resolve(): string {
    for (const detector of this.detectors) {
      const detected = detector();
      if (detected) {
        return detected;
      }
    }
    return this.fallback;
  }
}
