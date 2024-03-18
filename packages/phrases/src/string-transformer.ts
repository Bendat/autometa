import {
  camelCase,
  pascalCase,
  snakeCase,
  constantCase,
  capitalCase,
  paramCase,
} from "change-case-all";
export abstract class StringTransformer {
  abstract order: number;
  abstract transform(value: string): string;
}
export abstract class CaseTransformer extends StringTransformer {
  order = 5;
}
export class CamelCaseTransformer extends CaseTransformer {
  transform(value: string): string {
    return camelCase(value);
  }
}

export class PascalCaseTransformer extends CaseTransformer {
  transform(value: string): string {
    return pascalCase(value);
  }
}

export class SnakeCaseTransformer extends CaseTransformer {
  transform(value: string): string {
    return snakeCase(value);
  }
}

export class ConstantCaseTransformer extends CaseTransformer {
  transform(value: string): string {
    return constantCase(value);
  }
}
export class KebabCaseTransformer extends CaseTransformer {
  transform(value: string): string {
    return paramCase(value);
  }
}

export class CapitalCaseTransformer extends CaseTransformer {
  transform(value: string): string {
    return capitalCase(value);
  }
}

export class SuffixTransformer extends StringTransformer {
  order = 1;
  constructor(readonly suffix: string) {
    super();
  }
  transform(value: string): string {
    return `${value} ${this.suffix}`;
  }
}

export class PrefixTransformer extends StringTransformer {
  order = 0;
  constructor(readonly prefix: string) {
    super();
  }
  transform(value: string): string {
    return `${this.prefix} ${value}`;
  }
}

export class LowerTransformer extends CaseTransformer {
  transform(value: string): string {
    return value.toLowerCase();
  }
}

export class UpperTransformer extends CaseTransformer {
  transform(value: string): string {
    return value.toUpperCase();
  }
}
export class TrimTransformer extends CaseTransformer {
  transform(value: string): string {
    return value.replace(/\s/g, "");
  }
}

export class CollapseTransformer extends StringTransformer {
  order = 5;
  transform(value: string): string {
    return value.replace(/\s+/g, "");
  }
}
export function collapse() {
  return new CollapseTransformer();
}
export function upper() {
  return new UpperTransformer();
}

export function lower() {
  return new LowerTransformer();
}
export function camel() {
  return new CamelCaseTransformer();
}
export function pascal() {
  return new PascalCaseTransformer();
}
export function snake() {
  return new SnakeCaseTransformer();
}
export function constant() {
  return new ConstantCaseTransformer();
}
export function capital() {
  return new CapitalCaseTransformer();
}
export function kebab() {
  return new KebabCaseTransformer();
}
export function trim() {
  return new TrimTransformer();
}
export function sfx(suffix: string): () => SuffixTransformer;
export function sfx(suffix: TemplateStringsArray): () => SuffixTransformer;
export function sfx(suffix: TemplateStringsArray | string) {
  const val = getTemplateOrString(suffix);
  return () => new SuffixTransformer(val);
}
export function pfx(prefix: string): () => PrefixTransformer;
export function pfx(prefix: TemplateStringsArray): () => PrefixTransformer;
export function pfx(prefix: TemplateStringsArray | string) {
  const val = getTemplateOrString(prefix);
  return () => new PrefixTransformer(val);
}

function getTemplateOrString(value: TemplateStringsArray | string): string {
  if (typeof value === "string") {
    return value;
  }
  return value[0];
}
