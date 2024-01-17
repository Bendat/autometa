import { describe, it, expect } from "vitest";
import { Fixture } from "./fixture";
import { Inject } from "./inject";
import { defineContainerContext } from "./container-context";
import { Container } from "./container";
import { INJECTION_SCOPE } from "./scope.enum";
import { random } from "lodash";
import { Constructor } from "./constructor";
import { Token } from "./token";

describe("simple dependencies", () => {
  @Fixture
  class TestInner {}
  @Fixture
  class TestOuter {
    @Inject.class(TestInner)
    inner: TestInner;
  }
  it("it should construct a simple dependency hierarchy", () => {
    const context = defineContainerContext("abc");
    const container = new Container(context);
    const outer = container.get<TestOuter>(TestOuter);
    expect(outer).toBeDefined();
    expect(outer.inner).toBeDefined();
    expect(outer.inner).toBeInstanceOf(TestInner);
  });
});

const randomId = () => random(0, 10_000, false);

describe("cached dependencies are shared within a container", () => {
  @Fixture
  class CachedClass {
    id = randomId();
  }
  @Fixture
  class RootClass {
    @Inject.class(CachedClass)
    cache1: CachedClass;
    @Inject.class(CachedClass)
    cache2: CachedClass;
  }

  it("should share cached dependencies within a container", () => {
    const context = defineContainerContext("abc2");
    const container = new Container(context);
    const root = container.get<RootClass>(RootClass);
    expect(root).toBeDefined();
    expect(root.cache1).toBeDefined();
    expect(root.cache2).toBeDefined();
    expect(root.cache1).toBeInstanceOf(CachedClass);
    expect(root.cache2).toBeInstanceOf(CachedClass);
    expect(root.cache1.id).toEqual(root.cache2.id);
  });
});

describe("singletons are shared across containers and within containers", () => {
  @Fixture(INJECTION_SCOPE.SINGLETON)
  class SingletonClass {
    id = randomId();
  }
  @Fixture
  class RootClass {
    @Inject.class(SingletonClass)
    singleton: SingletonClass;
    @Inject.class(SingletonClass)
    singleton1: SingletonClass;
  }

  it("should share singletons within a container", () => {
    const context = defineContainerContext("abc3");
    const container = new Container(context);
    const root = container.get<RootClass>(RootClass);
    expect(root).toBeDefined();
    expect(root.singleton).toBeDefined();
    expect(root.singleton).toBeInstanceOf(SingletonClass);
    expect(root.singleton.id).toEqual(root.singleton1.id);
  });

  it("should share singletons across containers", () => {
    const context1 = defineContainerContext("abc4");
    const container1 = new Container(context1);
    const root1 = container1.get<RootClass>(RootClass);
    expect(root1).toBeDefined();
    expect(root1.singleton).toBeDefined();
    expect(root1.singleton).toBeInstanceOf(SingletonClass);
    expect(root1.singleton.id).toEqual(root1.singleton.id);

    const context2 = defineContainerContext("global");
    const container2 = new Container(context2);
    const root2 = container2.get<RootClass>(RootClass);
    expect(root2).toBeDefined();
    expect(root2.singleton).toBeDefined();
    expect(root2.singleton).toBeInstanceOf(SingletonClass);
    expect(root2.singleton.id).toEqual(root1.singleton.id);
  });
});
describe("more complex dependencies", () => {
  @Fixture(INJECTION_SCOPE.TRANSIENT)
  class TransientClass {
    id = randomId();
  }
  @Fixture(INJECTION_SCOPE.SINGLETON)
  class SingletonClass {
    id = randomId();
  }

  @Fixture
  class CachedClass {
    @Inject.class(TransientClass)
    transient: TransientClass;
    @Inject.class(SingletonClass)
    singleton: SingletonClass;
  }

  @Fixture
  class IntermediaryClass {
    @Inject.class(CachedClass)
    cached: CachedClass;
  }

  @Fixture
  class Root {
    @Inject.class(TransientClass)
    transient: TransientClass;
    @Inject.class(SingletonClass)
    singleton: SingletonClass;
    @Inject.class(IntermediaryClass)
    intermediary: IntermediaryClass;
    @Inject.class(CachedClass)
    cached: CachedClass;
  }

  it("should construct a complex dependency hierarchy", () => {
    const context = defineContainerContext("abc5");
    const container = new Container(context);
    const root = container.get<Root>(Root);
    expect(root).toBeDefined();
    expect(root.transient).toBeDefined();
    expect(root.singleton).toBeDefined();
    expect(root.intermediary).toBeDefined();
    expect(root.cached).toBeDefined();
    expect(root.transient).toBeInstanceOf(TransientClass);
    expect(root.singleton).toBeInstanceOf(SingletonClass);
    expect(root.intermediary).toBeInstanceOf(IntermediaryClass);
    expect(root.cached).toBeInstanceOf(CachedClass);
    expect(root.cached.transient).toBeInstanceOf(TransientClass);
    expect(root.cached.singleton).toBeInstanceOf(SingletonClass);
    expect(root.intermediary.cached).toBeInstanceOf(CachedClass);
    expect(root.intermediary.cached.transient).toBeInstanceOf(TransientClass);
    expect(root.intermediary.cached.singleton).toBeInstanceOf(SingletonClass);
    expect(root.singleton.id).toEqual(root.cached.singleton.id);
    expect(root.transient.id).not.toEqual(root.cached.transient.id);
    expect(root.intermediary.cached.singleton.id).toEqual(
      root.cached.singleton.id
    );
  });
});

describe("managing dependencies through a container", () => {
  it("should register a class procedurally", () => {
    const context = defineContainerContext("abc6");
    const container = new Container(context);
    class TestClass {}
    container.registerTransient(TestClass);
    const instance = container.get(TestClass);
    expect(instance).toBeInstanceOf(TestClass);
  });

  it("should register a value procedurally", () => {
    const context = defineContainerContext("abc7");
    const container = new Container(context);
    const instance = {};
    container.registerSingletonValue("foo", instance);
    expect(container.get("foo")).toEqual(instance);
  });

  it("should register a singleton procedurally", () => {
    const context = defineContainerContext("abc8");
    const container = new Container(context);
    class TestClass {}
    container.registerSingleton(TestClass);
    const instance = container.get(TestClass);
    const instance2 = container.get(TestClass);
    expect(instance).toBeInstanceOf(TestClass);
    expect(instance).toEqual(instance2);
  });

  it("should register a cached value procedurally", () => {
    const context = defineContainerContext("abc10");
    const container = new Container(context);
    const instance = { bob: "yes" };
    container.registerCachedValue("cached", instance);
    expect(container.get("cached")).toEqual(instance);
    expect(container.get("cached")).toBe(instance);
  });

  it("should register a cached class procedurally", () => {
    const context = defineContainerContext("abc11");
    const container = new Container(context);
    class TestClass {}
    container.registerCached(TestClass);
    const instance = container.get(TestClass);
    const instance2 = container.get(TestClass);
    expect(instance).toBeInstanceOf(TestClass);
    expect(instance).toBe(instance2);
  });
});

describe("constructors", () => {
  @Fixture
  class DependencyClass {}
  @Fixture
  class DependencyClass2 {}
  @Fixture
  @Constructor(DependencyClass, Token("class2"))
  class TestClass {
    constructor(public dependency: DependencyClass) {}
  }

  @Fixture
  class InheritedTestClass extends TestClass {}
  it("should construct a class with a constructor", () => {
    const context = defineContainerContext("abc12");
    const container = new Container(context);
    container.registerTransient(Token("class2"), DependencyClass2);
    const instance = container.get(TestClass);
    expect(instance).toBeInstanceOf(TestClass);
  });

  it("should construct a subclass with a constructor", () => {
    const context = defineContainerContext("abc13");
    const container = new Container(context);
    container.registerTransient(Token("class2"), DependencyClass2);
    const instance = container.get(InheritedTestClass);
    expect(instance).toBeInstanceOf(InheritedTestClass);
  });
});
