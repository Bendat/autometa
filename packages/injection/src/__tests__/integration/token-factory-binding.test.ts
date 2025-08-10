import "reflect-metadata";
import { Container } from "../../container";
import { createToken } from "../../types";
import { describe, it, expect, beforeEach } from "vitest";

describe("Token-based Factory Binding Tests", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  it("should resolve a token-based service registered with a factory", () => {
    interface IService {
      getValue(): string;
    }

    const SERVICE_TOKEN = createToken<IService>("IService");

    class MyServiceImpl implements IService {
      getValue(): string {
        return "Hello from service!";
      }
    }

    container.registerToken(SERVICE_TOKEN, () => new MyServiceImpl());

    const service = container.resolve(SERVICE_TOKEN);
    expect(service).toBeInstanceOf(MyServiceImpl);
    expect(service.getValue()).toBe("Hello from service!");
  });

  it("should resolve a token-based factory with dependencies", () => {
    interface IDependency {
      name: string;
    }

    const DEPENDENCY_TOKEN = createToken<IDependency>("IDependency");

    class DependencyImpl implements IDependency {
      name = "MyDependency";
    }

    interface IServiceWithDep {
      getDepName(): string;
    }

    const SERVICE_WITH_DEP_TOKEN =
      createToken<IServiceWithDep>("IServiceWithDep");

    class ServiceWithDepImpl implements IServiceWithDep {
      constructor(private dep: IDependency) {}
      getDepName(): string {
        return this.dep.name;
      }
    }

    container.registerClass(DependencyImpl);
    container.registerToken(DEPENDENCY_TOKEN, DependencyImpl);

    container.registerToken(
      SERVICE_WITH_DEP_TOKEN,
      (c) => new ServiceWithDepImpl(c.resolve(DEPENDENCY_TOKEN))
    );

    const service = container.resolve(SERVICE_WITH_DEP_TOKEN);
    expect(service).toBeInstanceOf(ServiceWithDepImpl);
    expect(service.getDepName()).toBe("MyDependency");
  });
});
