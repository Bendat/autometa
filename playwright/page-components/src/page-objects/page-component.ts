import "reflect-metadata";
import type { Class } from "@autometa/shared";
import { Locator, FrameLocator } from "@playwright/test";
import {
  type LocatorFactory,
} from "../locator";
import { Component } from "./component";
import { FallbackType, SemanticComponent } from "./semantic-component";
import {
  GetByAltTextOverloads,
  GetByLabelOverloads,
  GetByLocatorOverloads,
  GetByPlaceholderOverloads,
  GetByRoleOverloads,
  GetByTestIdOverloads,
  GetByTextOverloads,
  GetByTitleOverloads,
} from "./overloads";
export class PageComponent extends SemanticComponent {
  protected fallbackType: FallbackType<SemanticComponent> =
    PageComponent as Class<PageComponent>;

  static browse<T extends Component>(blueprint: Class<T>, locator: Locator) {
    return SemanticComponent.browse(blueprint, locator);
  }

  declare find: (locator: LocatorFactory) => any;
  declare frameLocator: (selector: string) => FrameLocator;

  declare getByAltText: GetByAltTextOverloads<PageComponent>;

  declare getByLabel: GetByLabelOverloads<PageComponent>;

  declare getByPlaceholder: GetByPlaceholderOverloads<PageComponent>;

  declare getByRole: GetByRoleOverloads<PageComponent>;

  declare getByTestId: GetByTestIdOverloads<PageComponent>;

  declare getByText: GetByTextOverloads<PageComponent>;

  declare getByTitle: GetByTitleOverloads<PageComponent>;

  declare locator: GetByLocatorOverloads<PageComponent>;

  declare textContent: Locator["textContent"];

  declare dispatchEvent: Locator["dispatchEvent"];

  declare evaluateHandle: Locator["evaluateHandle"];

  declare evaluate: Locator["evaluate"];

  declare evaluateAll: Locator["evaluateAll"];

  declare elementHandle: Locator["elementHandle"];

  declare getAttribute: Locator["getAttribute"];

  declare all: Locator["all"];

  declare blur: Locator["blur"];

  declare boundingBox: Locator["boundingBox"];

  declare count: Locator["count"];

  declare dblclick: Locator["dblclick"];

  declare dragTo: Locator["dragTo"];

  declare elementHandles: Locator["elementHandles"];

  declare filter: Locator["filter"];

  declare first: Locator["first"];

  declare focus: Locator["focus"];

  declare highlight: Locator["highlight"];

  declare hover: Locator["hover"];

  declare innerHTML: Locator["innerHTML"];

  declare innerText: Locator["innerText"];

  declare inputValue: Locator["inputValue"];

  declare isChecked: Locator["isChecked"];

  declare isDisabled: Locator["isDisabled"];

  declare isEditable: Locator["isEditable"];

  declare isEnabled: Locator["isEnabled"];

  declare isHidden: Locator["isHidden"];

  declare isVisible: Locator["isVisible"];

  declare last: Locator["last"];

  declare nth: Locator["nth"];

  declare scrollIntoViewIfNeeded: Locator["scrollIntoViewIfNeeded"];

  declare setChecked: Locator["setChecked"];

  declare setInputFiles: Locator["setInputFiles"];

  declare type: Locator["type"];

  declare fill: Locator["fill"];

  declare click: Locator["click"];

  declare tap: Locator["tap"];

  declare press: Locator["press"];

  declare allInnerTexts: Locator["allInnerTexts"];

  declare allTextContents: Locator["allTextContents"];

  declare check: Locator["check"];

  declare uncheck: Locator["uncheck"];

  declare clear: Locator["clear"];
}
