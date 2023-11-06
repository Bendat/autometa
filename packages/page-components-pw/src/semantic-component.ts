import {
  ElementHandle,
  FrameLocator,
  JSHandle,
  Locator,
  LocatorScreenshotOptions,
  Page
} from "playwright";
import { expect } from "playwright/test";
export class SemanticComponent {
  private parent: Page | Locator;
  get expect() {
    return expect(this.parent as Locator);
  }
  foo(){
    this.expect
  }
}

function createChildComponents<T extends Component>(
  cls: Class<T>,
  locator: Locator,
  children: DecoratedProperty<Component>[]
) {
  const accumulator: [string, Component][] = [];
  for (const { property, type } of children) {
    const childLocatorFactory: LocatorFactory = Reflect.getMetadata(
      locatorMetakey,
      cls.prototype,
      property
    );
    throwIfNoChildLocatorFound(childLocatorFactory, property, type);
    accumulator.push(
      createAndAssignChildComponent(
        property,
        type,
        childLocatorFactory(locator)
      )
    );
  }
  return accumulator;
}

function createAndAssignChildComponent(
  property: string,
  type: Class<Component>,
  childLocator: Locator
): [string, Component] {
  const pc = SemanticComponent.browse(type, childLocator);
  return [property, pc];
}

function throwIfNoChildLocatorFound(
  childLocatorFactory: LocatorFactory,
  property: string,
  type: Class<Component>
) {
  if (!childLocatorFactory) {
    throw new Error(
      `Cannot construct Component property ${property} of type ${type.name} without a Locator. Try adding a locator decorator like @Locate or @AltText`
    );
  }
}
