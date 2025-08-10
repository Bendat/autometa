import "reflect-metadata";
import { Container } from "../../container";
import { createDecorators, InjectableOptions } from "../../decorators";
import { describe, it, expect, beforeEach } from "vitest";

describe("Registration Override Tests", () => {
  let container: Container;
  let Injectable: (options?: InjectableOptions) => ClassDecorator;

  beforeEach(() => {
    container = new Container();
    const decorators = createDecorators(container);
    Injectable = decorators.Injectable;
  });

  it("should allow overriding a registration in the same container", () => {
    // Placeholder for test logic
  });

  it("should allow overriding a registration in a child container", () => {
    // Placeholder for test logic
  });
});
