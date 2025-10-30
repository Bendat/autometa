import "reflect-metadata";
import { Container } from "../../container";
import { createDecorators } from "../../decorators";
import { createToken } from "../../types";
import { beforeEach, describe, expect, it } from "vitest";

interface ILogger {
  log(message: string): void;
}

const LOGGER_TOKEN = createToken<ILogger>("ILogger");

describe("Property Injection with Token-based Dependency", () => {
  let container: Container;
  let Injectable: ReturnType<typeof createDecorators>["Injectable"];
  let Inject: ReturnType<typeof createDecorators>["Inject"];
  let ServiceWithLogger: new () => { logger: ILogger; doSomething(): void };
  let ConsoleLogger: new () => ILogger;

  beforeEach(() => {
    container = new Container();
    const decorators = createDecorators(container);
    Injectable = decorators.Injectable;
    Inject = decorators.Inject;

    @Injectable()
    class ConsoleLoggerImpl implements ILogger {
      log(_message: string): void {
        // Intentionally empty: the fake logger only verifies injection wiring.
      }
    }

    @Injectable()
    class ServiceWithLoggerImpl {
      @Inject(LOGGER_TOKEN)
      public logger!: ILogger;

      public doSomething(): void {
        this.logger.log("Doing something important!");
      }
    }

    container.registerToken(LOGGER_TOKEN, ConsoleLoggerImpl);
    container.registerClass(ServiceWithLoggerImpl);

    ConsoleLogger = ConsoleLoggerImpl;
    ServiceWithLogger = ServiceWithLoggerImpl;
  });

  it("should inject a logger into a property using a token", () => {
    const service = container.resolve(ServiceWithLogger);

    expect(service).toBeInstanceOf(ServiceWithLogger);
    expect(service.logger).toBeInstanceOf(ConsoleLogger);
  });
});
