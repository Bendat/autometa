import "reflect-metadata";
import { Container } from "../../container";
import { createDecorators, InjectableOptions } from "../../decorators";
import { createToken, Scope } from "../../types";
import { describe, it, expect, beforeEach } from "vitest";

describe("Property Injection with Token-based Dependency", () => {
  let container: Container;
  let Injectable: (options?: InjectableOptions) => ClassDecorator;
  let Inject: (token: any) => any;

  // Define a token for ILogger
  const LOGGER_TOKEN = createToken<ILogger>('ILogger');

  // Define the ILogger interface
  interface ILogger {
    log(message: string): void;
  }

  beforeEach(() => {
    container = new Container();
    const decorators = createDecorators(container);
    Injectable = decorators.Injectable;
    Inject = decorators.Inject;

    // Concrete implementation of ILogger
    @Injectable()
    class ConsoleLogger implements ILogger {
      log(message: string): void {
        console.log(`[ConsoleLogger]: ${message}`);
      }
    }

    // Register ConsoleLogger as the implementation for LOGGER_TOKEN
    container.registerToken(LOGGER_TOKEN, ConsoleLogger);

    // Define ServiceWithLogger inside beforeEach or it block
    @Injectable()
    class ServiceWithLogger {
      @Inject(LOGGER_TOKEN)
      public logger!: ILogger;

      public doSomething(): void {
        this.logger.log("Doing something important!");
      }
    }

    // The test itself
    it("should inject a logger into a property using a token", () => {
      const service = container.resolve(ServiceWithLogger);
      expect(service).toBeInstanceOf(ServiceWithLogger);
      expect(service.logger).toBeInstanceOf(ConsoleLogger);
      // Optionally, you can call the method to ensure it works
      // service.doSomething();
    });
  });
});
