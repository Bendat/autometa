import "reflect-metadata";
import { Container } from "../../container";
import { createDecorators } from "../../decorators";
import { beforeEach, describe, it } from "vitest";

describe("Scope Interaction Tests", () => {
  let container: Container;
  let _Injectable: ReturnType<typeof createDecorators>["Injectable"];

  beforeEach(() => {
    container = new Container();
  const decorators = createDecorators(container);
  _Injectable = decorators.Injectable;
  });

  it.skip("should resolve a singleton service with a transient dependency correctly", () => {
    // Placeholder for test logic
  });

  it.skip("should resolve a transient service with a singleton dependency correctly", () => {
    // Placeholder for test logic
  });
});
