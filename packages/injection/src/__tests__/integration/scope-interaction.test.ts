import "reflect-metadata";
import { Container } from "../../container";
import { createDecorators, InjectableOptions, Scope } from "../../decorators";
import { describe, it, expect, beforeEach } from "vitest";

describe("Scope Interaction Tests", () => {
  let container: Container;
  let Injectable: (options?: InjectableOptions) => ClassDecorator;

  beforeEach(() => {
    container = new Container();
    const decorators = createDecorators(container);
    Injectable = decorators.Injectable;
  });

  it("should resolve a singleton service with a transient dependency correctly", () => {
    // Placeholder for test logic
  });

  it("should resolve a transient service with a singleton dependency correctly", () => {
    // Placeholder for test logic
  });
});
