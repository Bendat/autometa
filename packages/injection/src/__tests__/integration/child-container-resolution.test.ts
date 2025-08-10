import "reflect-metadata";
import { Container, createChildContainer } from "../../container";
import { createDecorators, InjectableOptions } from "../../decorators";
import { Scope } from "../../types";
import { describe, it, expect, beforeEach } from "vitest";

describe("Child Container Resolution", () => {
  let parentContainer: Container;
  let childContainer: Container;
  let Injectable: (options?: InjectableOptions) => ClassDecorator;

  beforeEach(() => {
    parentContainer = new Container();
    childContainer = createChildContainer(parentContainer) as Container;
    const decorators = createDecorators(parentContainer);
    Injectable = decorators.Injectable;

    // Define some simple services
    @Injectable()
    class ParentService {}

    @Injectable()
    class ChildService {}

    @Injectable()
    class SharedService {}

    // Register services in parent
    parentContainer.register(ParentService, { type: 'class', target: ParentService });
    parentContainer.register(SharedService, { type: 'class', target: SharedService });

    // Register services in child
    childContainer.register(ChildService, { type: 'class', target: ChildService });
    // Override SharedService in child
    childContainer.register(SharedService, { type: 'class', target: SharedService });

    it("should resolve parent-registered services from the child container", () => {
      const service = childContainer.resolve(ParentService);
      expect(service).toBeInstanceOf(ParentService);
    });

    it("should NOT resolve child-registered services from the parent container", () => {
      expect(() => parentContainer.resolve(ChildService)).toThrow();
    });

    it("child container should override parent registrations", () => {
      const parentShared = parentContainer.resolve(SharedService);
      const childShared = childContainer.resolve(SharedService);

      expect(parentShared).toBeInstanceOf(SharedService);
      expect(childShared).toBeInstanceOf(SharedService);
      expect(parentShared).not.toBe(childShared); // Should be different instances due to override
    });

    it("singletons registered in parent should be singletons when resolved from child", () => {
      @Injectable({ scope: Scope.SINGLETON })
      class ParentSingletonService {}

      parentContainer.register(ParentSingletonService, { type: 'class', target: ParentSingletonService, scope: Scope.SINGLETON });

      const instance1 = childContainer.resolve(ParentSingletonService);
      const instance2 = childContainer.resolve(ParentSingletonService);

      expect(instance1).toBeInstanceOf(ParentSingletonService);
      expect(instance2).toBeInstanceOf(ParentSingletonService);
      expect(instance1).toBe(instance2); // Should be the same instance
    });

    it("singletons registered in child should be singletons when resolved from child", () => {
      @Injectable({ scope: Scope.SINGLETON })
      class ChildSingletonService {}

      childContainer.register(ChildSingletonService, { type: 'class', target: ChildSingletonService, scope: Scope.SINGLETON });

      const instance1 = childContainer.resolve(ChildSingletonService);
      const instance2 = childContainer.resolve(ChildSingletonService);

      expect(instance1).toBeInstanceOf(ChildSingletonService);
      expect(instance2).toBeInstanceOf(ChildSingletonService);
      expect(instance1).toBe(instance2); // Should be the same instance
    });
  });
});
