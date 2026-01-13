import { describe, expect, it } from "vitest";
import { DtoBuilder, DefaultValueDecorators, DTO, Property } from "../index";
import { isPlainObject, deepMerge, cloneValue } from "../utils";

describe("Additional coverage for builder-factory", () => {
  interface TestDto {
    id: number;
    items: string[];
    scores: number[];
    metadata?: { key: string };
  }

  const factory = DtoBuilder.forInterface<TestDto>({
    defaults: {
      id: () => 1,
      items: () => [],
      scores: () => [],
    },
  });

  describe("ArrayEditor methods", () => {
    it("supports insert at specific index", async () => {
      const dto = await factory
        .create()
        .items((items) => items.append("a").append("c").insert(1, "b"))
        .build();

      expect(dto.items).toEqual(["a", "b", "c"]);
    });

    it("handles insert with negative index", async () => {
      const dto = await factory
        .create()
        .items((items) => items.append("b").insert(-1, "a"))
        .build();

      expect(dto.items).toEqual(["a", "b"]);
    });

    it("handles insert beyond array length", async () => {
      const dto = await factory
        .create()
        .items((items) => items.append("a").insert(999, "b"))
        .build();

      expect(dto.items).toEqual(["a", "b"]);
    });

    it("supports set to replace at index", async () => {
      const dto = await factory
        .create()
        .items((items) => items.append("old").append("keep").set(0, "new"))
        .build();

      expect(dto.items).toEqual(["new", "keep"]);
    });

    it("throws error when set index is out of bounds", async () => {
      expect(() => {
        factory.create().items((items) => items.append("a").set(5, "b"));
      }).toThrow(RangeError);
    });

    it("throws error when set negative index", async () => {
      expect(() => {
        factory.create().items((items) => items.append("a").set(-1, "b"));
      }).toThrow(RangeError);
    });

    it("supports replace to replace entire array", async () => {
      const dto = await factory
        .create()
        .items((items) => items.append("old1").append("old2").replace(["new1", "new2", "new3"]))
        .build();

      expect(dto.items).toEqual(["new1", "new2", "new3"]);
    });

    it("supports clear to empty array", async () => {
      const dto = await factory
        .create()
        .items((items) => items.append("a").append("b").clear())
        .build();

      expect(dto.items).toEqual([]);
    });

    it("supports map to transform elements", async () => {
      const dto = await factory
        .create()
        .items((items) => items.append("a").append("b").map((val) => val.toUpperCase()))
        .build();

      expect(dto.items).toEqual(["A", "B"]);
    });

    it("supports sort without compareFn", async () => {
      const dto = await factory
        .create()
        .items((items) => items.append("c").append("a").append("b").sort())
        .build();

      expect(dto.items).toEqual(["a", "b", "c"]);
    });

    it("supports sort with custom compareFn", async () => {
      const dto = await factory
        .create()
        .scores((scores) => scores.append(3).append(1).append(2).sort((a, b) => b - a))
        .build();

      expect(dto.scores).toEqual([3, 2, 1]);
    });

    it("supports toArray to get array snapshot", async () => {
      const builder = factory.create();
      let captured: string[] = [];

      builder.items((items) => {
        items.append("a").append("b");
        captured = items.toArray();
        return items;
      });

      expect(captured).toEqual(["a", "b"]);
    });

    it("throws error when update index is out of bounds", async () => {
      expect(() => {
        factory.create().items((items) => items.append("a").update(5, () => "b"));
      }).toThrow(RangeError);
    });
  });

  describe("FluentCallbackContext error cases", () => {
    it("throws when mixing array and object helpers", async () => {
      expect(() => {
        factory.create().items((items: any) => {
          items.append("a");
          items.key("value"); // Try to use object helper after array
        });
      }).toThrow("Cannot use object helpers after array helpers");
    });

    it("handles callbacks for undefined properties", async () => {
      // When property is initially undefined/unknown, it can adapt to either mode
      const dto = await factory
        .create()
        .metadata((meta: any) => {
          meta.key("value"); // Uses object mode
        })
        .build();

      expect(dto.metadata).toEqual({ key: "value" });
    });

    it("supports deeply nested object callbacks", async () => {
      interface TypedDto {
        options: { settings: { enabled: boolean; count: number } };
      }

      const typedFactory = DtoBuilder.forInterface<TypedDto>({
        defaults: {
          options: () => ({ settings: { enabled: false, count: 0 } }),
        },
      });

      const dto = await typedFactory
        .create()
        .options((opts) => opts.settings((s) => s.enabled(true).count(5)))
        .build();

      expect(dto.options.settings).toEqual({ enabled: true, count: 5 });
    });
  });

  describe("Builder factory methods", () => {
    it("supports fromRaw to create builder from existing object", async () => {
      const raw = { id: 42, items: ["test"], scores: [1, 2, 3] };
      const dto = await factory.fromRaw(raw).set("id", 99).build();

      expect(dto.id).toBe(99);
      expect(dto.items).toEqual(["test"]);
    });

    it("uses build options internally for nested callbacks", async () => {
      // This tests that nested object callbacks use skipValidation internally
      interface NestedDto {
        outer: { inner: { value: number } };
      }

      const nestedFactory = DtoBuilder.forInterface<NestedDto>({
        defaults: {
          outer: () => ({ inner: { value: 0 } }),
        },
      });

      const dto = await nestedFactory
        .create()
        .outer((outer) => outer.inner((inner) => inner.value(42)))
        .build();

      expect(dto.outer.inner.value).toBe(42);
    });
  });

  describe("Validator composition", () => {
    it("composes async base validator with sync extra validator", async () => {
      const baseFactory = DtoBuilder.forInterface<TestDto>({
        defaults: { id: () => 1, items: () => [], scores: () => [] },
        validator: async (dto) => {
          if (dto.id < 0) throw new Error("base: id must be positive");
        },
      });

      const extended = baseFactory.extend({
        validator: (dto) => {
          if (dto.items.length === 0) throw new Error("extra: items required");
        },
      });

      await expect(extended.create().set("id", -1).build()).rejects.toThrow("base: id must be positive");
      await expect(extended.create().build()).rejects.toThrow("extra: items required");
    });

    it("composes sync base validator with async extra validator", async () => {
      const baseFactory = DtoBuilder.forInterface<TestDto>({
        defaults: { id: () => 5, items: () => ["default"], scores: () => [] },
        validator: (dto) => {
          if (dto.scores.length > 10) throw new Error("base: too many scores");
        },
      });

      const extended = baseFactory.extend({
        validator: async (dto) => {
          if (dto.items.length === 0) throw new Error("extra: items required");
        },
      });

      // Test that both validators run
      const valid = await extended.create().build();
      expect(valid.items).toEqual(["default"]);

      // Test async validator fails
      await expect(extended.create().set("items", []).build()).rejects.toThrow("extra: items required");
    });

    it("composes two async validators", async () => {
      const baseFactory = DtoBuilder.forInterface<TestDto>({
        defaults: { id: () => 1, items: () => [], scores: () => [] },
        validator: async (dto) => {
          if (dto.id < 0) throw new Error("base: id must be positive");
        },
      });

      const extended = baseFactory.extend({
        validator: async (dto) => {
          if (dto.items.length === 0) throw new Error("extra: items required");
        },
      });

      await expect(extended.create().set("id", -1).build()).rejects.toThrow("base: id must be positive");
      await expect(extended.create().build()).rejects.toThrow("extra: items required");

      const valid = await extended.create().append("items", "test").build();
      expect(valid.items).toEqual(["test"]);
    });
  });

  describe("Proxy edge cases", () => {
    it("handles symbol properties", () => {
      const builder = factory.create();
      const sym = Symbol("test");
      const builderAsAny = builder as any;

      // Symbols should be passed through to the underlying target
      builderAsAny[sym] = "value";
      expect(builderAsAny[sym]).toBe("value");
    });

    it("handles Symbol.toStringTag in callback context", async () => {
      const dto = await factory
        .create()
        .items((items: any) => {
          const tag = items[Symbol.toStringTag];
          expect(tag).toBe("FluentCallbackContext");
          return items.append("test");
        })
        .build();

      expect(dto.items).toEqual(["test"]);
    });
  });
});

describe("Additional coverage for decorators", () => {
  it("supports date decorator with number timestamp", async () => {
    class TimestampedDto {
      createdAt?: Date;
    }

    DefaultValueDecorators.date(1609459200000)(TimestampedDto.prototype, "createdAt");

    const factory = DtoBuilder.forClass(TimestampedDto);
    const dto = await factory.default();

    expect(dto.createdAt).toBeInstanceOf(Date);
    expect(dto.createdAt?.getTime()).toBe(1609459200000);
  });

  it("supports date decorator with string timestamp", async () => {
    class TimestampedDto {
      createdAt?: Date;
    }

    DefaultValueDecorators.date("2021-01-01T00:00:00.000Z")(TimestampedDto.prototype, "createdAt");

    const factory = DtoBuilder.forClass(TimestampedDto);
    const dto = await factory.default();

    expect(dto.createdAt).toBeInstanceOf(Date);
    expect(dto.createdAt?.toISOString()).toBe("2021-01-01T00:00:00.000Z");
  });

  it("supports date decorator with empty string (uses current date)", async () => {
    class TimestampedDto {
      createdAt?: Date;
    }

    DefaultValueDecorators.date("")(TimestampedDto.prototype, "createdAt");

    const factory = DtoBuilder.forClass(TimestampedDto);
    const dto = await factory.default();

    expect(dto.createdAt).toBeInstanceOf(Date);
    expect(dto.createdAt!.getTime()).toBeGreaterThan(0);
  });

  it("supports Property decorator with function", async () => {
    class CounterDto {
      count = 0;
    }

    let counter = 0;
    Property(() => ++counter)(CounterDto.prototype, "count");

    const factory = DtoBuilder.forClass(CounterDto);
    const dto1 = await factory.default();
    const dto2 = await factory.default();

    expect(dto1.count).toBe(1);
    expect(dto2.count).toBe(2);
  });

  it("supports Property decorator with static value", async () => {
    class ConfigDto {
      setting = "";
    }

    Property("default-value")(ConfigDto.prototype, "setting");

    const factory = DtoBuilder.forClass(ConfigDto);
    const dto = await factory.default();

    expect(dto.setting).toBe("default-value");
  });

  it("supports DTO alias decorators", async () => {
    class InnerDto {
      value = "";
    }

    class OuterDto {
      inner = new InnerDto();
      factoryValue = 0;
      staticValue = "";
      timestamp?: Date;
    }

    DTO.dto(InnerDto)(OuterDto.prototype, "inner");
    DTO.factory(() => 42)(OuterDto.prototype, "factoryValue");
    DTO.value("static")(OuterDto.prototype, "staticValue");
    DTO.date()(OuterDto.prototype, "timestamp");

    const factory = DtoBuilder.forClass(OuterDto);
    const dto = await factory.default();

    expect(dto.inner).toBeInstanceOf(InnerDto);
    expect(dto.factoryValue).toBe(42);
    expect(dto.staticValue).toBe("static");
    expect(dto.timestamp).toBeInstanceOf(Date);
  });

  it("throws error when decorator target has no constructor", () => {
    const target = Object.create(null);

    expect(() => {
      DefaultValueDecorators.value("test")(target, "prop");
    }).toThrow(); // Will throw when trying to access constructor property
  });
});

describe("Additional coverage for utils", () => {
  it("handles isPlainObject with null prototype", () => {
    const obj = Object.create(null);
    obj.key = "value";

    expect(isPlainObject(obj)).toBe(true);
  });

  it("protects against prototype pollution in deepMerge", () => {
    const target = { safe: "value" };
    const malicious = JSON.parse('{"__proto__": {"polluted": true}}');

    deepMerge(target, malicious);

    // Should not pollute Object.prototype
    expect((Object.prototype as any).polluted).toBeUndefined();
    expect(target).not.toHaveProperty("__proto__");
  });

  it("protects against constructor pollution in deepMerge", () => {
    const target = { safe: "value" };
    const malicious = { constructor: { polluted: true } };

    deepMerge(target, malicious);

    // Should not pollute constructor
    expect(target).not.toHaveProperty("constructor");
  });

  it("protects against prototype property pollution in deepMerge", () => {
    const target = { safe: "value" };
    const malicious = { prototype: { polluted: true } };

    deepMerge(target, malicious);

    // Should not add prototype property
    expect(target).not.toHaveProperty("prototype");
  });

  it("handles cloneValue with Date objects", () => {
    const original = new Date("2021-01-01");
    const cloned = cloneValue(original);

    expect(cloned).toBeInstanceOf(Date);
    expect(cloned.getTime()).toBe(original.getTime());
    expect(cloned).not.toBe(original);
  });
});

describe("Edge cases for builder normalization", () => {
  it("handles defaults input with undefined values", async () => {
    interface TestDto {
      defined?: string;
      undefined?: string;
    }

    const factory = DtoBuilder.forInterface<TestDto>({
      defaults: {
        defined: "value",
        undefined: undefined,
      } as any,
    });

    const dto = await factory.default();
    expect(dto.defined).toBe("value");
    expect(dto).not.toHaveProperty("undefined");
  });

  it("extends factory with no options", () => {
    const factory = DtoBuilder.forInterface<{ id: number }>({
      defaults: { id: () => 1 },
    });

    const extended = factory.extend();
    expect(extended).toBeDefined();
    expect(typeof extended.create).toBe("function");
  });
});
