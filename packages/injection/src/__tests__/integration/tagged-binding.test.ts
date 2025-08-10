import "reflect-metadata";
import { Container } from "../../container";
import { describe, it, expect, beforeEach } from "vitest";

describe("Tagged Binding Tests", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  it("should resolve all services by a specific tag", () => {
    class ServiceA {}
    class ServiceB {}

    container.registerClass(ServiceA, { tags: ["common-tag"] });
    container.registerClass(ServiceB, { tags: ["common-tag"] });

    const services = container.resolveByTag<any>("common-tag");

    expect(services).toHaveLength(2);
    expect(services[0]).toBeInstanceOf(ServiceA);
    expect(services[1]).toBeInstanceOf(ServiceB);
  });

  it("should resolve all services by a specific tag from parent container", () => {
    class ParentService {}

    container.registerClass(ParentService, { tags: ["parent-tag"] });

    const childContainer = container.createChild();
    const services = childContainer.resolveByTag<any>("parent-tag");

    expect(services).toHaveLength(1);
    expect(services[0]).toBeInstanceOf(ParentService);
  });

  it("should resolve all services by a specific tag from child container", () => {
    class ChildService {}

    const childContainer = container.createChild();
    childContainer.registerClass(ChildService, { tags: ["child-tag"] });

    const services = childContainer.resolveByTag<any>("child-tag");

    expect(services).toHaveLength(1);
    expect(services[0]).toBeInstanceOf(ChildService);

    // Ensure parent does not resolve child-only tags
    const parentServices = container.resolveByTag<any>("child-tag");
    expect(parentServices).toHaveLength(0);
  });

  it("should resolve all services by a specific tag when multiple tags are present", () => {
    class MultiTaggedService {}

    container.registerClass(MultiTaggedService, { tags: ["tag1", "tag2", "tag3"] });

    const servicesTag1 = container.resolveByTag<any>("tag1");
    expect(servicesTag1).toHaveLength(1);
    expect(servicesTag1[0]).toBeInstanceOf(MultiTaggedService);

    const servicesTag2 = container.resolveByTag<any>("tag2");
    expect(servicesTag2).toHaveLength(1);
    expect(servicesTag2[0]).toBeInstanceOf(MultiTaggedService);

    const servicesTag3 = container.resolveByTag<any>("tag3");
    expect(servicesTag3).toHaveLength(1);
    expect(servicesTag3[0]).toBeInstanceOf(MultiTaggedService);
  });
});
