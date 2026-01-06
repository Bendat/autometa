import type { EnsureChain, EnsureOptions } from "./ensure";
import { ensure as baseEnsure } from "./ensure";

export type EnsureInvoker = typeof baseEnsure;

export type EnsureInvoke = <T>(value: T, options?: EnsureOptions) => EnsureChain<T>;

/**
 * An ensure invoker that also exposes a stable, non-negated invoker.
 *
 * This exists to support plugin-level negation (`ensure.not.<plugin>.*`) without
 * forcing plugin authors to manually import the base ensure.
 *
 * Use `ensure.always(...)` for required-value extraction/preconditions that must
 * not be inverted by `.not`.
 */
export type EnsureInvokeWithAlways = EnsureInvoke & {
  readonly always: EnsureInvoke;
};

export type EnsureFacade<World, Facets extends Record<string, unknown>> = EnsureInvoke &
  Facets & { readonly world: World; readonly not: Facets };

export type EnsureFactory<World, Facets extends Record<string, unknown>> = (
  world: World
) => EnsureFacade<World, Facets>;

export interface AssertionPluginContext {
  readonly ensure: EnsureInvokeWithAlways;
}

export type AssertionPlugin<World, Facet> = (
  context: AssertionPluginContext
) => (world: World) => Facet;

type PluginFacetResult<World, Plugin> = Plugin extends AssertionPlugin<World, infer Facet>
  ? Facet
  : never;
type PluginFacets<World, Plugins extends Record<string, AssertionPlugin<World, unknown>>> = {
  readonly [Key in keyof Plugins]: PluginFacetResult<World, Plugins[Key]>;
};

export type EnsurePluginFacets<
  World,
  Plugins extends Record<string, AssertionPlugin<World, unknown>>
> = PluginFacets<World, Plugins>;

/**
 * Assemble a world-aware ensure factory using the provided assertion plugins.
 * Each plugin receives the base ensure function and returns a facet builder that is
 * invoked with the current world instance. The resulting facets are attached to a
 * callable ensure facade, preserving the base ensure invocation signature.
 */
export function createEnsureFactory<
  World,
  Plugins extends Record<string, AssertionPlugin<World, unknown>>
>(
  ensureFn: EnsureInvoke,
  plugins: Plugins
): EnsureFactory<World, PluginFacets<World, Plugins>> {
  const withAlways = (
    invoker: EnsureInvoke,
    always: EnsureInvoke
  ): EnsureInvokeWithAlways => {
    Object.defineProperty(invoker, "always", {
      value: always,
      enumerable: false,
      configurable: false,
      writable: false,
    });
    return invoker as EnsureInvokeWithAlways;
  };

  const positiveEnsure = withAlways(ensureFn, ensureFn);
  const pluginEntries = (Object.keys(plugins) as Array<keyof Plugins>).map((key) => {
    const plugin = plugins[key];
    if (!plugin) {
      throw new Error(`Assertion plugin "${String(key)}" is not defined.`);
    }
    const factory = plugin({ ensure: positiveEnsure });
    return [key, factory] as const;
  });

  const negatedEnsureFn: EnsureInvoke = <T>(value: T, options?: EnsureOptions) => {
    return ensureFn(value, options).not as unknown as EnsureChain<T>;
  };

  const negativeEnsure = withAlways(negatedEnsureFn, ensureFn);

  const negativePluginEntries = (Object.keys(plugins) as Array<keyof Plugins>).map((key) => {
    const plugin = plugins[key];
    if (!plugin) {
      throw new Error(`Assertion plugin "${String(key)}" is not defined.`);
    }
    const factory = plugin({ ensure: negativeEnsure });
    return [key, factory] as const;
  });

  return (world) => {
    const facade = ((value: unknown, options?: EnsureOptions) => ensureFn(value, options)) as EnsureFacade<
      World,
      PluginFacets<World, Plugins>
    >;

    Object.defineProperty(facade, "world", {
      value: world,
      enumerable: false,
      configurable: false,
      writable: false,
    });

    for (const [key, buildFacet] of pluginEntries) {
      const facet = buildFacet(world);
      Object.defineProperty(facade, key, {
        value: facet,
        enumerable: true,
        configurable: false,
        writable: false,
      });
    }

    const notFacade = {};
    for (const [key, buildFacet] of negativePluginEntries) {
      const facet = buildFacet(world);
      Object.defineProperty(notFacade, key, {
        value: facet,
        enumerable: true,
        configurable: false,
        writable: false,
      });
    }

    Object.defineProperty(facade, "not", {
      value: notFacade,
      enumerable: true,
      configurable: false,
      writable: false,
    });

    return facade;
  };
}

/**
 * Create a default ensure factory without any plugins. Useful when consumers
 * want a world-aware ensure facade without additional facets.
 */
export function createDefaultEnsureFactory<World>(): EnsureFactory<World, Record<string, never>> {
  return createEnsureFactory<World, Record<string, never>>(baseEnsure, {});
}
