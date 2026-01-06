import "reflect-metadata";
import { Container, createChildContainer } from "../../container";
import { createDecorators, InjectableOptions } from "../../decorators";
import { Scope } from "../../types";
import { describe, it, expect, beforeEach } from "vitest";

describe("Child Container Resolution", () => {
  let parentContainer: Container;
  let childContainer: Container;
  let Injectable: (options?: InjectableOptions) => ClassDecorator;
  let ParentServiceCtor: new () => unknown;
  let ChildServiceCtor: new () => unknown;
  let SharedServiceCtor: new () => unknown;

  beforeEach(() => {
    parentContainer = new Container();
    childContainer = createChildContainer(parentContainer) as Container;
    const decorators = createDecorators(parentContainer);
    Injectable = decorators.Injectable;

    // Define some simple services
    @Injectable()
    class ParentServiceImpl {}

    class ChildServiceImpl {}

    @Injectable()
    class SharedServiceImpl {}

    ParentServiceCtor = ParentServiceImpl;
    ChildServiceCtor = ChildServiceImpl;
    SharedServiceCtor = SharedServiceImpl;

    // Register services in parent
    parentContainer.register(ParentServiceCtor, { type: 'class', target: ParentServiceCtor });
    parentContainer.register(SharedServiceCtor, { type: 'class', target: SharedServiceCtor });

    // Register services in child
    childContainer.register(ChildServiceCtor, { type: 'class', target: ChildServiceCtor });
    // Override SharedService in child
    childContainer.register(SharedServiceCtor, { type: 'class', target: SharedServiceCtor });
  });

  it("should resolve parent-registered services from the child container", () => {
    const service = childContainer.resolve(ParentServiceCtor);
    expect(service).toBeInstanceOf(ParentServiceCtor);
  });

  it("should NOT resolve child-registered services from the parent container", () => {
    expect(() => parentContainer.resolve(ChildServiceCtor)).toThrow();
  });

  it("child container should override parent registrations", () => {
    const parentShared = parentContainer.resolve(SharedServiceCtor);
    const childShared = childContainer.resolve(SharedServiceCtor);

    expect(parentShared).toBeInstanceOf(SharedServiceCtor);
    expect(childShared).toBeInstanceOf(SharedServiceCtor);
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
