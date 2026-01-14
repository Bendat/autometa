import "reflect-metadata";
import { Container } from "../../container";
import { UnregisteredDependencyError } from "../../types";
import { describe, it, expect, beforeEach } from "vitest";

describe("Error Handling Tests", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  it("should throw UnregisteredDependencyError for unregistered dependencies", () => {
    class UnregisteredDependency {}

    class ServiceWithUnregisteredDep {
      constructor(public dep: UnregisteredDependency) {}
    }

    // We do NOT register UnregisteredDependency
    container.registerClass(ServiceWithUnregisteredDep, { deps: [UnregisteredDependency] });

    expect(() => container.resolve(ServiceWithUnregisteredDep)).toThrow(UnregisteredDependencyError);
  });

  it("should propagate errors from constructor during resolution", () => {
    class ServiceWithErrorInConstructor {
      constructor() {
        throw new Error("Error in constructor!");
      }
    }

    container.registerClass(ServiceWithErrorInConstructor);

    expect(() => container.resolve(ServiceWithErrorInConstructor)).toThrow("Error in constructor!");
  });
});
