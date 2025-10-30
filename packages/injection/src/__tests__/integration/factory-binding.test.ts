import "reflect-metadata";
import { Container } from "../../container";
import { describe, it, expect, beforeEach } from "vitest";
import { Scope } from "../../types";

describe("Factory Binding Tests", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  it("should resolve a service registered with a factory", () => {
    class MyService {
      value = "test";
    }

    container.registerFactory(MyService, () => new MyService());

    const service = container.resolve(MyService);
    expect(service).toBeInstanceOf(MyService);
    expect(service.value).toBe("test");
  });

  it("should resolve a factory with dependencies", () => {
    class DependencyService {
      id = 1;
    }

    class ConsumerService {
      constructor(public dep: DependencyService) {}
    }

    container.registerClass(DependencyService);
    container.registerFactory(
      ConsumerService,
      (c) => new ConsumerService(c.resolve(DependencyService))
    );

    const consumer = container.resolve(ConsumerService);
    expect(consumer).toBeInstanceOf(ConsumerService);
    expect(consumer.dep).toBeInstanceOf(DependencyService);
    expect(consumer.dep.id).toBe(1);
  });

  it("should respect singleton scope for factory bindings", () => {
    class SingletonService {
      static instanceCount = 0;
      constructor() {
        SingletonService.instanceCount++;
      }
    }

    container.registerFactory(SingletonService, () => new SingletonService(), {
      scope: Scope.SINGLETON,
    });

    const instance1 = container.resolve(SingletonService);
    const instance2 = container.resolve(SingletonService);

    expect(instance1).toBeInstanceOf(SingletonService);
    expect(instance2).toBeInstanceOf(SingletonService);
    expect(instance1).toBe(instance2);
    expect(SingletonService.instanceCount).toBe(1);
  });

  it("should respect transient scope for factory bindings", () => {
    class TransientService {
      static instanceCount = 0;
      constructor() {
        TransientService.instanceCount++;
      }
    }

    container.registerFactory(TransientService, () => new TransientService(), {
      scope: Scope.TRANSIENT,
    });

    const instance1 = container.resolve(TransientService);
    const instance2 = container.resolve(TransientService);

    expect(instance1).toBeInstanceOf(TransientService);
    expect(instance2).toBeInstanceOf(TransientService);
    expect(instance1).not.toBe(instance2);
    expect(TransientService.instanceCount).toBe(2);
  });
});
