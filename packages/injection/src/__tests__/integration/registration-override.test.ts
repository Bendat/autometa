import "reflect-metadata";
import { Container } from "../../container";
import { createDecorators } from "../../decorators";
import { beforeEach, describe, it } from "vitest";

describe("Registration Override Tests", () => {
  let container: Container;
  let _Injectable: ReturnType<typeof createDecorators>["Injectable"];

  beforeEach(() => {
    container = new Container();
  const decorators = createDecorators(container);
  _Injectable = decorators.Injectable;
  });

  it.skip("should allow overriding a registration in the same container", () => {
    // Placeholder for test logic
  });

  it.skip("should allow overriding a registration in a child container", () => {
    // Placeholder for test logic
  });
});
