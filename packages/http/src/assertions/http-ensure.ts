import { EnsureError, type EnsureOptions } from "@autometa/assertions";

type HeadersLike = {
  get(name: string): string | null;
  has?(name: string): boolean;
  entries?: () => IterableIterator<[string, string]>;
  [Symbol.iterator]?: () => IterableIterator<[string, string]>;
};

type HeaderSource = HeadersLike | Record<string, unknown>;

export type HttpResponseLike = {
  status: number;
  statusText?: string;
  headers: HeaderSource;
  data?: unknown;
  raw?: unknown;
};

export type StatusExpectation =
  | number
  | `${1 | 2 | 3 | 4 | 5}xx`
  | readonly [number, number]
  | { readonly min: number; readonly max: number }
  | ((status: number) => boolean);

export type HeaderExpectation =
  | string
  | RegExp
  | readonly string[]
  | ((value: string) => boolean);

export interface CacheControlExpectation {
  readonly cacheability?: "public" | "private";
  readonly maxAge?: number | { readonly min?: number; readonly max?: number };
  readonly sMaxAge?: number;
  readonly revalidate?: boolean;
  readonly immutable?: boolean;
}

export interface HttpEnsureChain<
  T extends HttpResponseLike = HttpResponseLike
> {
  readonly value: T;
  readonly not: HttpEnsureChain<T>;
  toHaveStatus(expectation: StatusExpectation): HttpEnsureChain<T>;
  toHaveHeader(
    name: string,
    expectation?: HeaderExpectation
  ): HttpEnsureChain<T>;
  toBeCacheable(expectation?: CacheControlExpectation): HttpEnsureChain<T>;
  toHaveCorrelationId(headerName?: string): HttpEnsureChain<T>;
}

type EnsureErrorDetails = ConstructorParameters<typeof EnsureError>[0];

export function ensureHttp<T extends HttpResponseLike>(
  response: T,
  options: EnsureOptions & { readonly negated?: boolean } = {}
): HttpEnsureChain<T> {
  return new HttpEnsureChainImpl<T>(response, {
    ...(options.label ? { label: options.label } : {}),
    negated: Boolean(options.negated),
  });
}

class HttpEnsureChainImpl<T extends HttpResponseLike>
  implements HttpEnsureChain<T>
{
  public readonly value: T;
  private readonly label: string | undefined;
  private readonly negated: boolean;
  private readonly normalized: NormalizedResponse;

  constructor(
    value: T,
    state: { readonly label?: string; readonly negated: boolean }
  ) {
    this.value = value;
    this.label = state.label;
    this.negated = state.negated;
    this.normalized = normalizeResponse(value);
  }

  public get not(): HttpEnsureChain<T> {
    return new HttpEnsureChainImpl(this.value, {
      ...(this.label ? { label: this.label } : {}),
      negated: !this.negated,
    });
  }

  public toHaveStatus(expectation: StatusExpectation): HttpEnsureChain<T> {
    const { pass, description } = matchesStatus(
      this.normalized.status,
      expectation
    );
    if (shouldFail(pass, this.negated)) {
      const baseMessage = this.negated
        ? `Expected response status not to be ${description}`
        : `Expected response status to be ${description}`;
      this.fail({
        matcher: "toHaveStatus",
        message: baseMessage,
        actual: this.normalized.status,
        expected: description,
      });
    }
    return this;
  }

  public toHaveHeader(
    name: string,
    expectation?: HeaderExpectation
  ): HttpEnsureChain<T> {
    const key = name.toLowerCase();
    const actual = this.normalized.headers[key];

    if (expectation === undefined) {
      const pass = actual !== undefined;
      if (shouldFail(pass, this.negated)) {
        const baseMessage = this.negated
          ? `Expected response not to include header ${name}`
          : `Expected response to include header ${name}`;
        this.fail({
          matcher: "toHaveHeader",
          message: baseMessage,
          actual: actual ?? "<missing>",
          expected: name,
        });
      }
      return this;
    }

    const pass = matchHeaderValue(actual, expectation);
    if (shouldFail(pass, this.negated)) {
      const baseMessage = this.negated
        ? `Expected header ${name} not to match`
        : `Expected header ${name} to match`;
      this.fail({
        matcher: "toHaveHeader",
        message: baseMessage,
        actual: actual ?? "<missing>",
        expected: expectation,
      });
    }

    return this;
  }

  public toBeCacheable(
    expectation: CacheControlExpectation = {}
  ): HttpEnsureChain<T> {
    const cacheControl = this.normalized.headers["cache-control"];

    if (!cacheControl) {
      if (!this.negated) {
        this.fail({
          matcher: "toBeCacheable",
          message: "Expected Cache-Control header to be present",
          actual: "<missing>",
        });
      }
      return this;
    }

    const directives = parseCacheControl(cacheControl);
    const impliedCacheable = !(
      "no-store" in directives || "no-cache" in directives
    );
    const expectationPass = evaluateCacheExpectations(directives, expectation);
    const pass = impliedCacheable && expectationPass;

    if (shouldFail(pass, this.negated)) {
      const baseMessage = this.negated
        ? "Expected response not to advertise cacheable directives"
        : "Expected response to advertise cacheable directives";
      this.fail({
        matcher: "toBeCacheable",
        message: baseMessage,
        actual: directives,
        expected: expectation,
      });
    }

    return this;
  }

  public toHaveCorrelationId(
    headerName = "x-correlation-id"
  ): HttpEnsureChain<T> {
    const key = headerName.toLowerCase();
    const value = this.normalized.headers[key];
    const pass = typeof value === "string" && value.trim().length > 0;

    if (shouldFail(pass, this.negated)) {
      const baseMessage = this.negated
        ? `Expected header ${headerName} to be missing or empty`
        : `Expected header ${headerName} to be present`;
      this.fail({
        matcher: "toHaveCorrelationId",
        message: baseMessage,
        actual: value ?? "<missing>",
        expected: headerName,
      });
    }

    return this;
  }

  private fail(details: Omit<EnsureErrorDetails, "receivedLabel">): never {
    const merged: EnsureErrorDetails = {
      ...details,
      ...(this.label ? { receivedLabel: this.label } : {}),
    };
    throw new EnsureError(merged);
  }
}

function shouldFail(pass: boolean, negated: boolean): boolean {
  return negated ? pass : !pass;
}

interface NormalizedResponse {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
  readonly original: unknown;
}

function normalizeResponse(response: HttpResponseLike): NormalizedResponse {
  return {
    status: response.status,
    statusText: response.statusText ?? "",
    headers: normalizeHeaders(response.headers),
    original: response.raw ?? response,
  };
}

function normalizeHeaders(source: HeaderSource): Record<string, string> {
  const result: Record<string, string> = {};

  // Headers instance (or anything structurally compatible)
  if (typeof (source as HeadersLike).get === "function") {
    const entries = (source as HeadersLike).entries;
    const iterator = entries
      ? entries.call(source)
      : (source as HeadersLike)[Symbol.iterator]?.call(source);
    if (iterator) {
      for (const [name, value] of iterator) {
        result[String(name).toLowerCase()] = String(value);
      }
      return result;
    }
  }

  // Plain record
  for (const [key, value] of Object.entries(
    source as Record<string, unknown>
  )) {
    result[String(key).toLowerCase()] = String(value);
  }

  return result;
}

function matchesStatus(
  status: number,
  expectation: StatusExpectation
): {
  pass: boolean;
  description: string;
} {
  if (typeof expectation === "number") {
    return {
      pass: status === expectation,
      description: expectation.toString(),
    };
  }

  if (typeof expectation === "string") {
    const digit = Number.parseInt(expectation.charAt(0), 10);
    if (!Number.isNaN(digit) && expectation.endsWith("xx")) {
      const min = digit * 100;
      return {
        pass: status >= min && status < min + 100,
        description: `${digit}xx`,
      };
    }
    return {
      pass: status.toString() === expectation,
      description: expectation,
    };
  }

  if (Array.isArray(expectation)) {
    const [min, max] = expectation;
    return {
      pass: status >= min && status <= max,
      description: `[${min}, ${max}]`,
    };
  }

  if (typeof expectation === "function") {
    return {
      pass: expectation(status),
      description: "predicate(status)",
    };
  }

  const range = expectation as { readonly min: number; readonly max: number };
  return {
    pass: status >= range.min && status <= range.max,
    description: `[${range.min}, ${range.max}]`,
  };
}

function matchHeaderValue(
  actual: string | undefined,
  expected: HeaderExpectation
): boolean {
  if (actual === undefined) {
    return false;
  }

  if (typeof expected === "string") {
    return actual === expected;
  }

  if (expected instanceof RegExp) {
    return expected.test(actual);
  }

  if (Array.isArray(expected as unknown[])) {
    const list = expected as readonly string[];
    const actualParts = actual
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    return list.every((value) => actualParts.includes(value));
  }

  return (expected as (value: string) => boolean)(actual);
}

type CacheDirectives = Record<string, string | true>;

function parseCacheControl(value: string): CacheDirectives {
  const directives: CacheDirectives = {};
  for (const segment of value.split(",")) {
    const trimmed = segment.trim();
    if (!trimmed) {
      continue;
    }
    const [rawName, rawParameter] = trimmed.split("=", 2);
    const name = rawName?.trim();
    if (!name) {
      continue;
    }
    if (rawParameter === undefined) {
      directives[name.toLowerCase()] = true;
      continue;
    }
    const parameter = rawParameter.trim().replace(/^"|"$/g, "");
    directives[name.toLowerCase()] = parameter;
  }
  return directives;
}

function evaluateCacheExpectations(
  directives: CacheDirectives,
  expectation: CacheControlExpectation
): boolean {
  if (expectation.cacheability) {
    if (!(expectation.cacheability in directives)) {
      return false;
    }
  }

  if (expectation.maxAge !== undefined) {
    const raw = directives["max-age"];
    if (typeof raw !== "string") {
      return false;
    }
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      return false;
    }
    if (typeof expectation.maxAge === "number") {
      if (parsed !== expectation.maxAge) {
        return false;
      }
    } else {
      const { min, max } = expectation.maxAge;
      if (min !== undefined && parsed < min) {
        return false;
      }
      if (max !== undefined && parsed > max) {
        return false;
      }
    }
  }

  if (expectation.sMaxAge !== undefined) {
    const raw = directives["s-maxage"];
    if (typeof raw !== "string") {
      return false;
    }
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed !== expectation.sMaxAge) {
      return false;
    }
  }

  if (expectation.revalidate) {
    if (
      !("must-revalidate" in directives || "proxy-revalidate" in directives)
    ) {
      return false;
    }
  }

  if (expectation.immutable && !("immutable" in directives)) {
    return false;
  }

  return true;
}
