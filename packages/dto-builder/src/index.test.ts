import { describe, expect, it, vi } from "vitest";
import { DefaultValueDecorators, DtoBuilder } from "./index";

interface UserProfile {
  name: string;
  active: boolean;
}

interface UserDto {
  id: number;
  name: string;
  tags: string[];
  profile?: UserProfile;
  history: Array<{ action: string; meta: { id: number; details?: string } }>;
  preferences?: {
    notifications: {
      email: { enabled: boolean; addresses: string[] };
      sms: { enabled: boolean };
    };
  };
}

describe("DtoBuilder.forInterface", () => {
  const factory = DtoBuilder.forInterface<UserDto>({
    defaults: {
      id: () => 0,
      name: "anonymous",
      tags: () => [],
      profile: () => ({ name: "", active: false }),
      history: () => [],
      preferences: () => ({
        notifications: {
          email: { enabled: false, addresses: [] },
          sms: { enabled: false },
        },
      }),
    },
  });

  it("constructs an object using defaults", async () => {
    const builder = factory.create();
    const dto = await builder.build();
    expect(dto).toEqual({
      id: 0,
      name: "anonymous",
      tags: [],
      profile: { name: "", active: false },
      history: [],
      preferences: {
        notifications: {
          email: { enabled: false, addresses: [] },
          sms: { enabled: false },
        },
      },
    });
  });

  it("allows chaining state mutations", async () => {
    const builder = factory
      .create()
      .set("id", 42)
      .set("name", "Ben")
      .append("tags", "admin")
      .merge("profile", { active: true })
      .update("profile", (profile) => ({
        ...(profile ?? { name: "", active: false }),
        name: "Ben",
      }));

    const dto = await builder.build();
    expect(dto).toEqual({
      id: 42,
      name: "Ben",
      tags: ["admin"],
      profile: { name: "Ben", active: true },
      history: [],
      preferences: {
        notifications: {
          email: { enabled: false, addresses: [] },
          sms: { enabled: false },
        },
      },
    });
  });

  it("exposes fluent property accessors", async () => {
    const builder = factory.create();
    builder.name("Eve");
    builder.profile({ name: "Eve", active: true });

    expect(builder.name()).toBe("Eve");
    expect(builder.name.value).toBe("Eve");

    const dto = await builder.build();
    expect(dto.name).toBe("Eve");
    expect(dto.profile).toEqual({ name: "Eve", active: true });
  });

  it("creates derived builders without mutating the original", async () => {
    const base = factory.create().set("name", "Base");
    const derived = base.derive().set("name", "Derived");

    const [baseDto, derivedDto] = await Promise.all([base.build(), derived.build()]);
    expect(baseDto.name).toBe("Base");
    expect(derivedDto.name).toBe("Derived");
  });

  it("prioritizes special methods when property names clash", async () => {
    interface WeirdShape {
      set: string;
    }

    const weirdFactory = DtoBuilder.forInterface<WeirdShape>();
    const builder = weirdFactory.create();

    builder.set("set", "value");

    const dto = await builder.build();
    expect(dto.set).toBe("value");
    expect(typeof (builder as unknown as Record<string, unknown>).set).toBe("function");
  });

  it("allows assigning arbitrary properties", async () => {
    const builder = factory.create().assign("unexpected", 99);
    const dto = await builder.build();
    expect(dto).toHaveProperty("unexpected", 99);
  });

  it("appends values to dynamic arrays", async () => {
    const builder = factory.create().append("extra", "alpha").append("extra", "beta");
    const dto = await builder.build();
    expect(dto).toHaveProperty("extra", ["alpha", "beta"]);
  });

  it("supports array callbacks on typed properties", async () => {
    const builder = factory
      .create()
      .tags((tags) => tags.append("beta").prepend("alpha").remove((value) => value === "beta"));

    const dto = await builder.build();
    expect(dto.tags).toEqual(["alpha"]);
  });

  it("supports array callbacks on nested object properties", async () => {
    const builder = factory
      .create()
      .history((entries) =>
        entries
          .append({ action: "login", meta: { id: 1 } })
          .append({ action: "logout", meta: { id: 2 } })
          .update(0, (entry) => ({ ...entry, meta: { ...entry.meta, details: "first" } }))
      );

    const dto = await builder.build();
    expect(dto.history).toEqual([
      { action: "login", meta: { id: 1, details: "first" } },
      { action: "logout", meta: { id: 2 } },
    ]);
  });

  it("attaches nested values while preserving defaults", async () => {
    const builder = factory
      .create()
      .attach("profile", "name", "Dana")
      .attach("metadata", "traceId", "abc-123");

    const dto = await builder.build();
    expect(dto.profile).toEqual({ name: "Dana", active: false });
    expect(dto).toHaveProperty("metadata.traceId", "abc-123");
  });

  it("configures object properties via fluent callback", async () => {
    const builder = factory
      .create()
      .profile((profile) => profile.name("Delta").active(true))
      .profile((profile) => {
        profile.name("Echo");
      });

    const dto = await builder.build();
    expect(dto.profile).toEqual({ name: "Echo", active: true });
  });

  it("does not mutate base builder when configuring nested objects", async () => {
    const base = factory.create();
    const derived = base.derive().profile((profile) => profile.name("Foxtrot"));

    const [baseDto, derivedDto] = await Promise.all([base.build(), derived.build()]);

    expect(baseDto.profile).toEqual({ name: "", active: false });
    expect(derivedDto.profile).toEqual({ name: "Foxtrot", active: false });
  });

  it("appends objects into typed arrays without leaking references", async () => {
    const base = factory
      .create()
      .append("history", { action: "login", meta: { id: 1, details: "initial" } });

    const derived = base
      .derive()
      .append("history", { action: "logout", meta: { id: 2 } })
      .update("history", (entries) => {
        const source = entries ?? [];
        if (source.length === 0) {
          return source;
        }
        const cloned = source.map((item) => ({ action: item.action, meta: { ...item.meta } }));
        const [first, ...rest] = cloned;
        if (!first) {
          return cloned;
        }
        const updatedFirst = {
          action: first.action,
          meta: { ...first.meta, details: "updated" as const },
        };
        return [updatedFirst, ...rest];
      });

    const [baseDto, derivedDto] = await Promise.all([base.build(), derived.build()]);

    expect(baseDto.history).toEqual([{ action: "login", meta: { id: 1, details: "initial" } }]);
    expect(derivedDto.history).toEqual([
      { action: "login", meta: { id: 1, details: "updated" } },
      { action: "logout", meta: { id: 2 } },
    ]);
  });

  it("supports appending objects to dynamic arrays", async () => {
    const builder = factory
      .create()
      .append("auditLog", { type: "create", data: { user: "alice" } })
      .append("auditLog", { type: "update", data: { user: "bob", fields: ["tags"] } });

    const dto = await builder.build();
    expect(dto).toMatchObject({
      auditLog: [
        { type: "create", data: { user: "alice" } },
        { type: "update", data: { user: "bob", fields: ["tags"] } },
      ],
    });
  });

  it("creates dynamic objects via attach without prior defaults", async () => {
    const builder = factory
      .create()
      .attach("settings", "theme", "dark")
      .attach("settings", "notifications", { email: true });

    const dto = await builder.build();
    expect(dto).toMatchObject({ settings: { theme: "dark", notifications: { email: true } } });
  });

  it("extends builder factories with extra defaults and methods", async () => {
    const extended = factory.extend({
      defaults: { name: "extended" },
      methods: {
        asAdmin() {
          return this.tags((tags) => tags.append("admin"));
        },
        named(name: string) {
          return this.name(name);
        },
      },
    });

    const [baseDto, extendedDto] = await Promise.all([
      factory.default(),
      extended.create().asAdmin().build(),
    ]);

    expect(baseDto.name).toBe("anonymous");
    expect(extendedDto.name).toBe("extended");
    expect(extendedDto.tags).toEqual(["admin"]);

    const renamed = await extended.create().named("Renamed").build();
    expect(renamed.name).toBe("Renamed");
  });

  it("preserves extension methods when deriving builders", async () => {
    const extended = factory.extend({
      methods: {
        withTag(tag: string) {
          return this.tags((tags) => tags.append(tag));
        },
      },
    });

    const base = extended.create().withTag("one");
    const derived = base.derive().withTag("two");

    const [baseDto, derivedDto] = await Promise.all([base.build(), derived.build()]);
    expect(baseDto.tags).toEqual(["one"]);
    expect(derivedDto.tags).toEqual(["one", "two"]);
  });
});

describe("DtoBuilder.forClass", () => {
  class Account {
    id = 0;
    flags: string[] = [];
    profile: { name: string; active: boolean } = { name: "", active: false };
  }

  class DecoratedProfile {
    name = "";
    active = false;
  }

  DefaultValueDecorators.value("Decorated")(DecoratedProfile.prototype, "name");
  DefaultValueDecorators.value(true)(DecoratedProfile.prototype, "active");

  class DecoratedAccount {
    id = 0;
    flags: string[] = [];
    profile = new DecoratedProfile();
    createdAt?: Date;
  }

  DefaultValueDecorators.value(99)(DecoratedAccount.prototype, "id");
  DefaultValueDecorators.factory(() => ["decorated"])(DecoratedAccount.prototype, "flags");
  DefaultValueDecorators.dto(DecoratedProfile)(DecoratedAccount.prototype, "profile");
  DefaultValueDecorators.date()(DecoratedAccount.prototype, "createdAt");

  it("builds instances of the provided class", async () => {
    const factory = DtoBuilder.forClass(Account, {
      defaults: {
        flags: () => ["active"],
      },
    });

    const builder = factory
      .create()
      .set("id", 7)
      .append("flags", "beta")
      .merge("profile", { name: "Alice" });

    const account = await builder.build();
    expect(account).toBeInstanceOf(Account);
    expect(account.id).toBe(7);
    expect(account.flags).toEqual(["active", "beta"]);
    expect(account.profile).toEqual({ name: "Alice", active: false });
  });

  it("runs validators and surfaces errors", async () => {
    const validator = vi.fn((dto: Account) => {
      if (dto.id < 0) {
        throw new Error("id must be positive");
      }
    });
    const factory = DtoBuilder.forClass(Account, { validator });
    const builder = factory.create().set("id", -1);

  await expect(async () => builder.build()).rejects.toThrowError("id must be positive");
    expect(validator).toHaveBeenCalledTimes(1);
  });

  it("supports async validators", async () => {
    const validator = vi.fn(async (dto: Account) => {
      if (!dto.flags.includes("verified")) {
        throw new Error("unverified account");
      }
    });

    const factory = DtoBuilder.forClass(Account, { validator });

    const valid = factory.create().append("flags", "verified");
    const invalid = factory.create();

    const validDto = await valid.build();
    expect(validDto.flags).toContain("verified");

    await expect(invalid.build()).rejects.toThrowError("unverified account");
    expect(validator).toHaveBeenCalledTimes(2);
  });

  it("provides fluent accessors for class properties", async () => {
    const factory = DtoBuilder.forClass(Account);
    const builder = factory.create();

    builder.id(21).profile({ name: "Charlie", active: true });

    const dto = await builder.build();
    expect(dto.id).toBe(21);
    expect(dto.profile).toEqual({ name: "Charlie", active: true });
  });

  it("retains custom methods before and after fluent calls", async () => {
    const factory = DtoBuilder.forClass(Account);
    const base = factory.create();
    type AccountBuilderInstance = typeof base;
    const builder = base as AccountBuilderInstance & {
      activate(): AccountBuilderInstance;
    };

    builder.activate = function () {
      this.append("flags", "activated");
      return this;
    };

    await builder.activate().flags(["activated", "verified"]).build();

    const dto = await builder.build();
    expect(dto.flags).toEqual(["activated", "verified"]);
    expect(typeof builder.activate).toBe("function");
  });

  it("supports assigning and attaching dynamic keys on class builders", async () => {
    const factory = DtoBuilder.forClass(Account);
    const builder = factory
      .create()
      .assign("status", "legacy")
      .attach("profile", "active", true)
      .attach("metadata", "origin", "imported");

    const dto = await builder.build();
    expect(dto).toMatchObject({
      id: 0,
      flags: [],
      profile: { name: "", active: true },
      status: "legacy",
      metadata: { origin: "imported" },
    });
  });

  it("supports nested callbacks for class properties", async () => {
    const factory = DtoBuilder.forClass(Account);
    const dto = await factory
      .create()
      .profile((profile) => profile.name("Gamma").active(true))
      .build();

    expect(dto.profile).toEqual({ name: "Gamma", active: true });
  });

  it("supports array callbacks for class properties", async () => {
    const factory = DtoBuilder.forClass(Account);
    const dto = await factory
      .create()
      .flags((flags) => flags.append("beta").append("gamma").remove((value) => value === "beta"))
      .build();

    expect(dto.flags).toEqual(["gamma"]);
  });

  it("applies decorator-driven defaults", async () => {
    const factory = DtoBuilder.forClass(DecoratedAccount);
    const dto = await factory.default();

    expect(dto).toBeInstanceOf(DecoratedAccount);
    expect(dto.id).toBe(99);
    expect(dto.flags).toEqual(["decorated"]);
    expect(dto.profile).toBeInstanceOf(DecoratedProfile);
    expect(dto.profile).toEqual({ name: "Decorated", active: true });
    expect(dto.createdAt).toBeInstanceOf(Date);
  });

  it("allows overriding decorator defaults while preserving nested defaults", async () => {
    const factory = DtoBuilder.forClass(DecoratedAccount);
    const dto = await factory
      .create()
      .id(123)
      .profile((profile) => profile.name("Custom"))
      .build();

    expect(dto.id).toBe(123);
    expect(dto.profile).toEqual({ name: "Custom", active: true });
    expect(dto.flags).toEqual(["decorated"]);
  });
});

describe("Nested callback depth", () => {
  const factory = DtoBuilder.forInterface<UserDto>({
    defaults: {
      id: () => 0,
      name: "anonymous",
      tags: () => [],
      profile: () => ({ name: "", active: false }),
      history: () => [],
      preferences: () => ({
        notifications: {
          email: { enabled: false, addresses: [] },
          sms: { enabled: false },
        },
      }),
    },
  });

  it("allows deeply nested callback composition", async () => {
    const dto = await factory
      .create()
      .preferences((prefs) =>
        prefs.notifications((notifications) =>
          notifications
            .email((email) =>
              email
                .enabled(true)
                .addresses((addresses) => addresses.append("team@example.com"))
            )
            .sms((sms) => sms.enabled(true))
        )
      )
      .build();

    expect(dto.preferences).toEqual({
      notifications: {
        email: { enabled: true, addresses: ["team@example.com"] },
        sms: { enabled: true },
      },
    });
  });
});
