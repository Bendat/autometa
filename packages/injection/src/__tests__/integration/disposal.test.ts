import "reflect-metadata";
import { Container } from "../../container";
import { describe, it, expect, beforeEach } from "vitest";
import { Scope } from "../../types";

describe("Disposal Tests", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  it("should call dispose method on disposable instances when container is disposed", async () => {
    class DisposableService {
      disposed = false;
      dispose() {
        this.disposed = true;
      }
    }

    container.registerClass(DisposableService, { scope: Scope.SINGLETON });
    const service = container.resolve(DisposableService);

    expect(service.disposed).toBe(false);
    await container.dispose();
    expect(service.disposed).toBe(true);
  });

  it("should call dispose method on disposable instances in child containers when parent is disposed", async () => {
    class ChildDisposableService {
      disposed = false;
      dispose() {
        this.disposed = true;
      }
    }

    const childContainer = container.createChild();
    childContainer.registerClass(ChildDisposableService, { scope: Scope.SINGLETON });
    const service = childContainer.resolve(ChildDisposableService);

    expect(service.disposed).toBe(false);
    await container.dispose(); // Dispose parent, which should dispose children
    expect(service.disposed).toBe(true);
  });

  it("should not call dispose on transient instances", async () => {
    class TransientDisposableService {
      disposed = false;
      dispose() {
        this.disposed = true;
      }
    }

    container.registerClass(TransientDisposableService, { scope: Scope.TRANSIENT });
    const service = container.resolve(TransientDisposableService);

    expect(service.disposed).toBe(false);
    await container.dispose();
    expect(service.disposed).toBe(false);
  });
});
