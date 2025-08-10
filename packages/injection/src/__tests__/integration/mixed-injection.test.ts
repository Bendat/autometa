import "reflect-metadata";
import { Container } from "../../container";
import { createDecorators, InjectableOptions } from "../../decorators";
import { createToken } from "../../types";
import { describe, it, expect, beforeEach } from "vitest";

describe("Mixed Injection Tests", () => {
  let container: Container;
  let Injectable: (options?: InjectableOptions) => ClassDecorator;
  let Inject: (token: any) => any;

  beforeEach(() => {
    container = new Container();
    const decorators = createDecorators(container);
    Injectable = decorators.Injectable;
    Inject = decorators.Inject;
  });

  it("should resolve a service with both constructor and property injection", () => {
    class ConstructorDependency {
      id = "constructor-dep";
    }

    class PropertyDependency {
      id = "property-dep";
    }

    @Injectable({ deps: [ConstructorDependency] })
    class MixedInjectionService {
      constructor(public constructorDep: ConstructorDependency) {}

      @Inject(PropertyDependency)
      public propertyDep!: PropertyDependency;
    }

    container.registerClass(ConstructorDependency);
    container.registerClass(PropertyDependency);

    const service = container.resolve(MixedInjectionService);

    expect(service).toBeInstanceOf(MixedInjectionService);
    expect(service.constructorDep).toBeInstanceOf(ConstructorDependency);
    expect(service.constructorDep.id).toBe("constructor-dep");
    expect(service.propertyDep).toBeInstanceOf(PropertyDependency);
    expect(service.propertyDep.id).toBe("property-dep");
  });

  it("should resolve a complex dependency graph", () => {
    class ServiceA {
      id = "ServiceA";
    }

    @Injectable({ deps: [ServiceA] })
    class ServiceB {
      constructor(public a: ServiceA) {}
      id = "ServiceB";
    }

    interface IServiceC {
      id: string;
      getBId(): string;
      b: ServiceB;
    }
    const SERVICE_C_TOKEN = createToken<IServiceC>("IServiceC");

    @Injectable({ deps: [ServiceB] })
    class ServiceCImpl implements IServiceC {
      constructor(public b: ServiceB) {}
      id = "ServiceCImpl";
      getBId(): string {
        return this.b.id;
      }
    }

    class ServiceD {
      id = "ServiceD";
    }

    @Injectable()
    class ServiceE {
      @Inject(ServiceD)
      public d!: ServiceD;
      id = "ServiceE";
    }

    @Injectable({ deps: [SERVICE_C_TOKEN, ServiceE] })
    class TopLevelService {
      constructor(public c: IServiceC, public e: ServiceE) {}
      id = "TopLevelService";
    }

    container.registerClass(ServiceA);
    container.registerToken(SERVICE_C_TOKEN, ServiceCImpl);
    container.registerClass(ServiceD);
    container.registerClass(ServiceE);
    container.registerClass(TopLevelService);

    const topService = container.resolve(TopLevelService);

    expect(topService).toBeInstanceOf(TopLevelService);
    expect(topService.c).toBeInstanceOf(ServiceCImpl);
    expect(topService.c.id).toBe("ServiceCImpl");
    expect(topService.c.getBId()).toBe("ServiceB");
    expect(topService.c.b).toBeInstanceOf(ServiceB);
    expect(topService.c.b.a).toBeInstanceOf(ServiceA);
    expect(topService.e).toBeInstanceOf(ServiceE);
    expect(topService.e.d).toBeInstanceOf(ServiceD);
  });

  it("should resolve ServiceCImpl directly", () => {
    class ServiceA {
      id = "ServiceA";
    }

    @Injectable({ deps: [ServiceA] })
    class ServiceB {
      constructor(public a: ServiceA) {}
      id = "ServiceB";
    }

    interface IServiceC {
      id: string;
      getBId(): string;
      b: ServiceB;
    }
    const SERVICE_C_TOKEN = createToken<IServiceC>("IServiceC");

    @Injectable({ deps: [ServiceB] })
    class ServiceCImpl implements IServiceC {
      constructor(public b: ServiceB) {}
      id = "ServiceCImpl";
      getBId(): string {
        return this.b.id;
      }
    }

    container.registerClass(ServiceA);

    const serviceC = container.resolve(ServiceCImpl);

    expect(serviceC).toBeInstanceOf(ServiceCImpl);
    expect(serviceC.b).toBeInstanceOf(ServiceB);
    expect(serviceC.b.a).toBeInstanceOf(ServiceA);
  });
});