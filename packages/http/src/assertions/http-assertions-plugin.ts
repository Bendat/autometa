import type { AssertionPlugin, EnsureOptions } from "@autometa/assertions";

import type { HTTPResponse } from "../http-response";
import {
  ensureHttp,
  type HttpEnsureChain,
  type HttpResponseLike,
} from "./http-ensure";

/**
 * Callable facet attached as `ensure.http(...)`.
 *
 * Supports plugin-level negation: `ensure.not.http(response)`.
 * Also supports chain-level negation: `ensure.http(response).not...`.
 */
export type HttpAssertionsFacet = <T = unknown>(
  response: HttpResponseLike<T> | HTTPResponse<T>,
  options?: EnsureOptions
) => HttpEnsureChain<HttpResponseLike<T>>;

/**
 * Assertion plugin that provides HTTP response matchers as a facet.
 *
 * This keeps the base `ensure(value)` matcher chain domain-agnostic.
 */
export const httpAssertionsPlugin = <World>(): AssertionPlugin<World, HttpAssertionsFacet> =>
  ({ ensure }) =>
  (_world) => {
    const isNegated = ensure !== ensure.always;

    const facet: HttpAssertionsFacet = <T = unknown>(
      response: HttpResponseLike<T> | HTTPResponse<T>,
      options?: EnsureOptions
    ) => {
      return ensureHttp(response as HttpResponseLike<T>, {
        ...(options?.label ? { label: options.label } : {}),
        negated: isNegated,
      });
    };

    return facet;
  };
