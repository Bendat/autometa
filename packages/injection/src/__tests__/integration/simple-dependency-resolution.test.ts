import "reflect-metadata";
import { Container } from "../../container";
import { createDecorators } from "../../decorators";
import { beforeEach, describe, expect, it } from "vitest";

describe("Container and Decorator Integration", () => {
  let container: Container;
  let Injectable: ReturnType<typeof createDecorators>["Injectable"];

  beforeEach(() => {
    container = new Container();
    const decorators = createDecorators(container);
    Injectable = decorators.Injectable;
  });

  it("should resolve a simple dependency", () => {
    @Injectable()
    class Service {}

    @Injectable({ deps: [Service] })
    class Consumer {
      constructor(public service: Service) {}
    }

    const consumer = container.resolve(Consumer);
    expect(consumer).toBeInstanceOf(Consumer);
    expect(consumer.service).toBeInstanceOf(Service);
  });
});
