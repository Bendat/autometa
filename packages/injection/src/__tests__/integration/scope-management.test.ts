import "reflect-metadata";
import { Container } from "../../container";
import { createDecorators, InjectableOptions } from "../../decorators";
import { Scope } from "../../types";
import { describe, it, expect, beforeEach } from "vitest";

describe("Scope Management (Singleton and Transient)", () => {
  let container: Container;
  let Injectable: (options?: InjectableOptions) => ClassDecorator;

  // Define a simple service to test scoping
  class CounterService {
    private count = 0;

    increment(): void {
      this.count++;
    }

    getCount(): number {
      return this.count;
    }
  }

  beforeEach(() => {
    container = new Container();
    const decorators = createDecorators(container);
    Injectable = decorators.Injectable;
  });

  it("should return the same instance for a SINGLETON scope", () => {
    @Injectable({ scope: Scope.SINGLETON })
    class SingletonCounterService extends CounterService {}

    const instance1 = container.resolve(SingletonCounterService);
    const instance2 = container.resolve(SingletonCounterService);

    expect(instance1).toBeInstanceOf(SingletonCounterService);
    expect(instance2).toBeInstanceOf(SingletonCounterService);
    expect(instance1).toBe(instance2); // Should be the same instance

    instance1.increment();
    expect(instance2.getCount()).toBe(1); // Changes in one reflect in the other
  });

  it("should return different instances for a TRANSIENT scope", () => {
    @Injectable({ scope: Scope.TRANSIENT })
    class TransientCounterService extends CounterService {}

    const instance1 = container.resolve(TransientCounterService);
    const instance2 = container.resolve(TransientCounterService);

    expect(instance1).toBeInstanceOf(TransientCounterService);
    expect(instance2).toBeInstanceOf(TransientCounterService);
    expect(instance1).not.toBe(instance2); // Should be different instances

    instance1.increment();
    expect(instance1.getCount()).toBe(1);
    expect(instance2.getCount()).toBe(0); // Changes in one do not reflect in the other
  });
});
