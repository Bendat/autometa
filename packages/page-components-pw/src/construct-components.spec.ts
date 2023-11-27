import { describe, it, expect, vi } from "vitest";
import { Component, WebPage } from "./component";
import { ByFactory, ByLabel } from "./decorators";
import { Page } from "playwright";

const page = vi.fn() as unknown as Page;

class TestComponent1 extends Component {}

class TestComponent2 extends Component {
  @ByFactory(TestComponent1, vi.fn())
  tc1: TestComponent1;
}

class ComposedComponent extends Component {
  @ByFactory(TestComponent1, vi.fn())
  tc1: TestComponent1;

  @ByFactory(TestComponent2, vi.fn())
  tc2: TestComponent2;
}

class TestPage extends WebPage {
  route: string;
  @ByFactory(TestComponent1, vi.fn())
  tc1: TestComponent1;
}
describe("construct-components", () => {
  it("should construct components", () => {
    const cc = constructComponents(page, ComposedComponent);
    expect(cc.tc1).toBeDefined();
    expect(cc.tc1).toBeInstanceOf(TestComponent1);
    expect(cc.tc2).toBeDefined();
    expect(cc.tc2).toBeInstanceOf(TestComponent2);
    expect(cc.tc2.tc1).toBeDefined();
    expect(cc.tc2.tc1).toBeInstanceOf(TestComponent1);
  });

  it("should construct a webpage", () => {
    const cc = constructComponents(page, TestPage);
    expect(cc.tc1).toBeDefined();
    expect(cc.tc1).toBeInstanceOf(TestComponent1);
  });
});
