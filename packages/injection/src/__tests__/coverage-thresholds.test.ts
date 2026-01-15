import { beforeEach, describe, expect, it } from "vitest";

import {
  Container,
  Scope,
  createContainer,
  createDecorators,
  createToken,
  getIdentifierName,
} from "../index";

describe("injection coverage gaps", () => {
  let container: Container;

  beforeEach(() => {
    container = createContainer() as Container;
  });

  it("covers context-aware container methods used by factories", () => {
    class HandlerA {
      readonly name = "a";
    }

    class HandlerB {
      readonly name = "b";
    }

    container.registerClass(HandlerA, { tags: ["handler"] });
    container.registerClass(HandlerB, { tags: ["handler"] });

    container.registerFactory("exercise", (c) => {
      // Registration via the context-aware container
      c.registerValue("inner", "value");

      expect(c.isRegistered("inner")).toBe(true);
      expect(c.getBinding("inner")?.type).toBe("value");
      expect(c.resolve<string>("inner")).toBe("value");

      // Tag matching via resolveAll + resolveByTag
      const allHandlers = c.resolveAll("handler");
      const byTag = c.resolveByTag("handler");

      expect(allHandlers.length).toBeGreaterThanOrEqual(2);
      expect(byTag.length).toBeGreaterThanOrEqual(2);

      // Optional resolution
      expect(c.tryResolve("missing")).toBeUndefined();

      // Child container behavior
      const child = c.createChild();
      expect(child.parent).toBeDefined();
      expect(child.resolve<string>("inner")).toBe("value");

      return "ok";
    });

    expect(container.resolve("exercise")).toBe("ok");
  });

  it("covers context-aware container dispose delegation", async () => {
    container.registerValue("a", 1);

    container.registerFactory("ctx", (c) => c);
    const ctx = container.resolve<unknown>("ctx") as { dispose(): Promise<void> };

    await ctx.dispose();

    expect(container.isRegistered("a")).toBe(false);
  });

  it("covers token bindings for constructor and invalid targets", () => {
    class Service {
      readonly value = 123;
    }

    const SERVICE_TOKEN = createToken<Service>("service");
    container.registerClass(Service);
    container.registerToken(SERVICE_TOKEN, Service);

    const resolved = container.resolve(SERVICE_TOKEN);
    expect(resolved).toBeInstanceOf(Service);
    expect(resolved.value).toBe(123);

    const BAD_TOKEN = createToken<unknown>("bad");
    container.registerToken(BAD_TOKEN, 123 as unknown as never);

    expect(() => container.resolve(BAD_TOKEN)).toThrow(
      /Invalid token binding target/
    );
  });

  it("covers getIdentifierName branches", () => {
    expect(getIdentifierName("str")).toBe("str");

    const sym = Symbol("x");
    expect(getIdentifierName(sym)).toContain("Symbol");

    // Runtime-safety branch: non-string, non-symbol identifiers without a name
    expect(getIdentifierName({} as never)).toBe("anonymous");
  });

  it("covers decorator factory error paths and metadata branches", () => {
    const { Injectable, Inject, LazyInject } = createDecorators(container);

    class Dep {
      readonly label = "dep";
    }

    const TOK = createToken<{ id: string }>("tok");

    class Target {
      public dep!: Dep;
      public lazy!: { id: string };
      constructor(_dep: Dep) {
        void _dep;
      }
    }

    // Property decorator path
    Inject(Dep)(Target.prototype, "dep");

    // Lazy property decorator path
    LazyInject(TOK)(Target.prototype, "lazy");

    // Parameter decorator path
    Inject(Dep)(Target as unknown as object, undefined as never, 0);

    // Class decorator path (registers into the container)
    Injectable({ scope: Scope.SINGLETON, deps: [Dep] })(Target);

    expect(container.isRegistered(Target)).toBe(true);

    const binding = container.getBinding(Target) as unknown as {
      type: string;
      scope: Scope;
      deps?: unknown[];
      props?: Array<{ property: string | symbol; token: unknown; lazy?: boolean }>;
    };

    expect(binding.type).toBe("class");
    expect(binding.scope).toBe(Scope.SINGLETON);
    expect(binding.deps).toEqual([Dep]);

    expect(binding.props).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: "dep", token: Dep, lazy: false }),
        expect.objectContaining({ property: "lazy", token: TOK, lazy: true }),
      ])
    );

    // Error branches: wrong decorator usage
    expect(() => (Injectable() as unknown as (t: unknown) => void)(123)).toThrow(
      TypeError
    );

    expect(() =>
      (Inject(Dep) as unknown as (t: unknown, p: unknown, i: unknown) => void)(
        {},
        undefined,
        0
      )
    ).toThrow(TypeError);
  });
});
