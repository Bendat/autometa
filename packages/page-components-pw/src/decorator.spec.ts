import "reflect-metadata";
import { describe, it, expect } from "vitest";
import {
  ByAltText,
  ByLabel,
  ByRole,
  ByTestId,
  Inject,
  PageMap
} from "./decorators";
import { Locator } from "playwright";
import { Component, WebPage } from "./component";
function injector() {
  //
  return null as unknown as Locator;
}
class TestSubSubComponent extends Component {}
class TestSubComponent extends Component {
  @ByTestId(TestSubSubComponent, "boop")
  bob: TestSubSubComponent;
}
class TestComponent extends Component {
  @ByAltText(TestSubComponent, "foo")
  bob: TestSubComponent;
  @ByLabel(TestSubSubComponent, "bob")
  bob2: TestSubSubComponent;
}
class _Root extends WebPage {
  @ByRole(TestComponent, "alert")
  bob: TestComponent;
}

describe("adding components to map", () => {
  it("should add a component to the map", () => {
    const components = PageMap.get(TestComponent.prototype);
    expect(components).toBeDefined();
    expect(components?.bob).toBe(TestSubComponent);
    expect(components?.bob2).toBe(TestSubSubComponent);

    const subComponents = PageMap.get(TestSubComponent);
    expect(subComponents).toBeDefined();
    expect(subComponents?.bob).toBe(TestSubSubComponent);
  });
});
