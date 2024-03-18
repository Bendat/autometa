import { Locator } from "@playwright/test";
import { createContext } from "vm";
import {
  SemanticComponent,
  ByTestId,
  PageComponent,
  ByPlaceholder,
  ByLabel,
  FillOptions,
} from "../src";

export class TodoInput extends SemanticComponent {
  async create(...items: string[]) {
    for (const item of items) {
      await this.fill(item);
      await this.press("Enter");
    }
  }
}

export class TodoPage extends SemanticComponent {
  @ByTestId("todo-title")
  todoTitles: PageComponent;

  @ByPlaceholder("What needs to be done?")
  newTodo: TodoInput;

  @ByLabel("Mark all as complete")
  markComplete: PageComponent;

  @ByTestId("todo-count")
  todoCount: PageComponent;

  @ByTestId("todo-item")
  items: PageComponent;

  localStorageCount = async (expected: number) => {
    return await this.page().waitForFunction((e) => {
      return JSON.parse(localStorage["react-todos"]).length === e;
    }, expected);
  };
}
