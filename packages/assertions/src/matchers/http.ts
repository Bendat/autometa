import type { MatcherContext } from "../core/context";
import { shouldFail } from "../core/context";
import { buildFailureMessage } from "../core/messages";

type HeadersLike = {
  get(name: string): string | null;
  has?(name: string): boolean;
  entries?: () => IterableIterator<[string, string]>;
  [Symbol.iterator]?: () => IterableIterator<[string, string]>;
};

type HeaderSource = HeadersLike | Record<string, unknown> | Headers;

export type HttpResponseLike = {
  status: number;
  statusText?: string;
  headers: HeaderSource;
  data?: unknown;
  raw?: unknown;
};

interface NormalizedResponse {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
  readonly original: unknown;
}

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

export function assertToHaveStatus<T>(
  ctx: MatcherContext<T>,
  expectation: StatusExpectation
): void {
  const normalized = ensureResponse(ctx, "toHaveStatus");
  const { pass, description } = matchesStatus(normalized.status, expectation);
  if (shouldFail(pass, ctx.negated)) {
    const baseMessage = ctx.negated
      ? `Expected response status not to be ${description}`
      : `Expected response status to be ${description}`;
    ctx.fail("toHaveStatus", {
      message: buildFailureMessage("toHaveStatus", baseMessage, {
        actual: normalized.status,
        expected: description,
        actualLabel: "Received http response",
      }),
      actual: normalized.status,
      expected: description,
    });
  }
}

export function assertToHaveHeader<T>(
  ctx: MatcherContext<T>,
  name: string,
  expectation?: HeaderExpectation
): string | undefined {
  const normalized = ensureResponse(ctx, "toHaveHeader");
  const actual = normalized.headers[name.toLowerCase()];

  if (expectation === undefined) {
    const pass = actual !== undefined;
    if (shouldFail(pass, ctx.negated)) {
      const baseMessage = ctx.negated
        ? `Expected response not to include header ${name}`
        : `Expected response to include header ${name}`;
      ctx.fail("toHaveHeader", {
        message: buildFailureMessage("toHaveHeader", baseMessage, {
          actual: actual ?? "<missing>",
          expected: name,
        }),
        actual: actual ?? "<missing>",
        expected: name,
      });
    }
    return actual;
  }

  const pass = matchHeaderValue(actual, expectation);
  if (shouldFail(pass, ctx.negated)) {
    const baseMessage = ctx.negated
      ? `Expected header ${name} not to match`
      : `Expected header ${name} to match`;
    ctx.fail("toHaveHeader", {
      message: buildFailureMessage("toHaveHeader", baseMessage, {
        actual: actual ?? "<missing>",
        expected: expectation,
      }),
      actual: actual ?? "<missing>",
      expected: expectation,
    });
  }
  return actual;
}

export function assertToBeCacheable<T>(
  ctx: MatcherContext<T>,
  expectation: CacheControlExpectation = {}
): void {
  const normalized = ensureResponse(ctx, "toBeCacheable");
  const cacheControl = normalized.headers["cache-control"];

  if (!cacheControl) {
    if (!ctx.negated) {
      ctx.fail("toBeCacheable", {
        message: buildFailureMessage("toBeCacheable", "Expected Cache-Control header to be present", {
          actual: "<missing>",
        }),
        actual: "<missing>",
      });
    }
    return;
  }

  const directives = parseCacheControl(cacheControl);
  const impliedCacheable = !("no-store" in directives || "no-cache" in directives);
  const expectationPass = evaluateCacheExpectations(directives, expectation);
  const pass = impliedCacheable && expectationPass;

  if (shouldFail(pass, ctx.negated)) {
    const baseMessage = ctx.negated
      ? "Expected response not to advertise cacheable directives"
      : "Expected response to advertise cacheable directives";
    ctx.fail("toBeCacheable", {
      message: buildFailureMessage("toBeCacheable", baseMessage, {
        actual: directives,
        expected: expectation,
      }),
      actual: directives,
      expected: expectation,
    });
  }
}

export function assertToHaveCorrelationId<T>(
  ctx: MatcherContext<T>,
  headerName = "x-correlation-id"
): string {
  const normalized = ensureResponse(ctx, "toHaveCorrelationId");
  const value = normalized.headers[headerName.toLowerCase()];
  const pass = typeof value === "string" && value.trim().length > 0;

  if (shouldFail(pass, ctx.negated)) {
    const baseMessage = ctx.negated
      ? `Expected header ${headerName} to be missing or empty`
      : `Expected header ${headerName} to be present`; 
    ctx.fail("toHaveCorrelationId", {
      message: buildFailureMessage("toHaveCorrelationId", baseMessage, {
        actual: value ?? "<missing>",
        expected: headerName,
      }),
      actual: value ?? "<missing>",
      expected: headerName,
    });
  }

  return value ?? "";
}

function ensureResponse<T>(ctx: MatcherContext<T>, matcher: string): NormalizedResponse {
  const normalized = normalizeResponse(ctx.value);
  if (normalized) {
    return normalized;
  }

  ctx.fail(matcher, {
    message: buildFailureMessage(matcher, "Expected value to resemble an HTTP response object", {
      actual: ctx.value,
    }),
    actual: ctx.value,
  });
}

function normalizeResponse(source: unknown): NormalizedResponse | null {
  if (typeof source !== "object" || source === null) {
    return null;
  }

  if (isNormalized(source)) {
    return source;
  }

  const candidate = source as Partial<HttpResponseLike>;
  if (typeof candidate.status !== "number") {
    return null;
  }

  const headersSource = candidate.headers;
  if (!headersSource) {
    return null;
  }

  const headers = normalizeHeaders(headersSource);
  if (!headers) {
    return null;
  }

  return {
    status: candidate.status,
    statusText: typeof candidate.statusText === "string" ? candidate.statusText : "",
    headers,
    original: source,
  };
}

function isNormalized(value: unknown): value is NormalizedResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "headers" in value &&
    "original" in value
  );
}

function normalizeHeaders(source: HeaderSource): Record<string, string> | null {
  if (isHeadersLike(source)) {
    const entries = getHeaderEntries(source);
    const result: Record<string, string> = {};
    for (const [key, value] of entries) {
      if (typeof value === "string") {
        result[key.toLowerCase()] = value;
      }
    }
    return result;
  }

  if (typeof source === "object" && source !== null) {
    const result: Record<string, string> = {};
    for (const [key, raw] of Object.entries(source)) {
      if (raw == null) {
        continue;
      }
      if (Array.isArray(raw)) {
        result[key.toLowerCase()] = raw.filter((value): value is string => typeof value === "string").join(", ");
        continue;
      }
      if (typeof raw === "string") {
        result[key.toLowerCase()] = raw;
      }
    }
    return result;
  }

  return null;
}

function isHeadersLike(value: unknown): value is HeadersLike {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as HeadersLike;
  return typeof candidate.get === "function";
}

function* getHeaderEntries(headers: HeadersLike): IterableIterator<[string, string]> {
  if (typeof headers.entries === "function") {
    yield* headers.entries();
    return;
  }

  if (typeof headers[Symbol.iterator] === "function") {
    const iteratorFn = headers[Symbol.iterator];
    if (typeof iteratorFn === "function") {
      yield* iteratorFn.call(headers) as IterableIterator<[string, string]>;
      return;
    }
    return;
  }

  const keys = Reflect.ownKeys(headers) as Array<string | symbol>;
  for (const key of keys) {
    if (typeof key === "string") {
      const value = (headers as Record<string, unknown>)[key];
      if (typeof value === "string") {
        yield [key, value];
      }
    }
  }
}

function matchesStatus(status: number, expectation: StatusExpectation): {
  pass: boolean;
  description: string;
} {
  if (typeof expectation === "number") {
    return { pass: status === expectation, description: expectation.toString() };
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
    return { pass: status.toString() === expectation, description: expectation };
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

function matchHeaderValue(actual: string | undefined, expected: HeaderExpectation): boolean {
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
    if (!("must-revalidate" in directives || "proxy-revalidate" in directives)) {
      return false;
    }
  }

  if (expectation.immutable && !("immutable" in directives)) {
    return false;
  }

  return true;
}

export type { NormalizedResponse };

export interface HttpResponseSnapshot<T = unknown> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  request?: unknown;
}

export function fromHttpResponse<T extends { headers: Record<string, string> }>(
  response: T & { status: number; statusText?: string; data?: unknown }
): HttpResponseLike {
  return {
    status: response.status,
    statusText: response.statusText ?? "",
    headers: response.headers,
    data: response.data,
    raw: response,
  };
}

export function fromFetchResponse(response: Response, data?: unknown): HttpResponseLike {
  return {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    data,
    raw: response,
  };
}