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
  let LazyInject: ReturnType<typeof createDecorators>["LazyInject"];
  let ServiceWithLogger: new () => { logger: ILogger; doSomething(): void };
  let ConsoleLogger: new () => ILogger;

  beforeEach(() => {
    container = new Container();
    const decorators = createDecorators(container);
    Injectable = decorators.Injectable;
    Inject = decorators.Inject;
    LazyInject = decorators.LazyInject;

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

  it("should resolve property dependencies lazily and cache the value", () => {
    let resolveCount = 0;
    container.registerFactory(LOGGER_TOKEN, () => {
      resolveCount += 1;
      return new ConsoleLogger();
    });

    @Injectable()
    class LazyService {
      @LazyInject(LOGGER_TOKEN)
      public logger!: ILogger;
    }

    container.registerClass(LazyService);

    const service = container.resolve(LazyService);

    expect(resolveCount).toBe(0);

    const firstLogger = service.logger;
    expect(resolveCount).toBe(1);
    expect(firstLogger).toBeInstanceOf(ConsoleLogger);

    const secondLogger = service.logger;
    expect(resolveCount).toBe(1);
    expect(secondLogger).toBe(firstLogger);
  });
});
