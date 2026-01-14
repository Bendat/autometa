import {
  camelCase,
  pascalCase,
  snakeCase,
  constantCase,
  capitalCase,
  paramCase,
} from "change-case";
import type { PhraseTransform, PhraseTransformFactory } from "./types";

type TransformKind = Exclude<PhraseTransform["kind"], undefined>;

function createTransform(
  name: string,
  apply: (value: string) => string,
  kind?: TransformKind
): PhraseTransformFactory {
  return () => {
    return {
      name,
      apply,
      ...(kind ? { kind } : {}),
    } satisfies PhraseTransform;
  };
}

function valueFrom(input: TemplateStringsArray | string): string {
  if (typeof input === "string") {
    return input;
  }

  return input[0] ?? "";
}

export const camel = createTransform("camel", camelCase, "case");

export const pascal = createTransform("pascal", pascalCase, "case");

export const snake = createTransform("snake", snakeCase, "case");

export const constant = createTransform("constant", constantCase, "case");

export const capital = createTransform("capital", capitalCase, "case");

export const kebab = createTransform("kebab", paramCase, "case");

export const lower = createTransform("lower", (value) => value.toLowerCase(), "case");

export const upper = createTransform("upper", (value) => value.toUpperCase(), "case");

export const trim = createTransform("trim", (value) => value.replace(/\s/g, ""), "sanitize");

export const collapse = createTransform(
  "collapse",
  (value) => value.replace(/\s+/g, ""),
  "sanitize"
);

export function prefix(value: TemplateStringsArray | string): PhraseTransformFactory {
  const resolved = valueFrom(value);
  return createTransform(`prefix(${resolved})`, (input) =>
    `${resolved} ${input}`
  , "prefix");
}

export function suffix(value: TemplateStringsArray | string): PhraseTransformFactory {
  const resolved = valueFrom(value);
  return createTransform(`suffix(${resolved})`, (input) =>
    `${input} ${resolved}`
  , "suffix");
}
