import "reflect-metadata";
import { Container } from "../../container";
import { createDecorators } from "../../decorators";
import { CircularDependencyError } from "../../types";
import { describe, it, expect, beforeEach } from "vitest";
const container = new Container();
const decorators = createDecorators(container);
const Injectable = decorators.Injectable;
// Define classes with circular dependency
@Injectable()
class ServiceA {
  constructor(public serviceB: ServiceB) {}
}

@Injectable({ deps: [ServiceA] })
class ServiceB {
  constructor(public serviceA: ServiceA) {}
}
describe("Circular Dependency Detection", () => {
  beforeEach(() => {
    // Register the services
    container.register(ServiceA, {
      type: "class",
      target: ServiceA,
      deps: [ServiceB],
    });
    container.register(ServiceB, {
      type: "class",
      target: ServiceB,
      deps: [ServiceA],
    });
  });

  it("should throw a CircularDependencyError when a circular dependency is detected", () => {
    // Attempt to resolve ServiceA, which will trigger the circular dependency
    expect(() => container.resolve(ServiceA)).toThrow(CircularDependencyError);

    // Attempt to resolve ServiceB, which will also trigger the circular dependency
    expect(() => container.resolve(ServiceB)).toThrow(CircularDependencyError);
  });
});
