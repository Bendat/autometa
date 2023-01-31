import { expect } from "@playwright/test";
import { PageComponent, SemanticComponent } from "../src";
import { ByPlaceholder, ByTestId } from "../src/page-objects/decorators";
import { test } from "./runner";

test.beforeEach(async ({ page }) => {
  await page.goto("https://demo.playwright.dev/todomvc");
});

const TODO_ITEMS = [
  "buy some cheese",
  "feed the cat",
  "book a doctors appointment",
];

test.describe("New Todo", () => {
  test("should allow me to add todo items", async ({
    todoPage: { newTodo, todoTitles: todoTitle, localStorageCount },
  }) => {
    await newTodo.create(TODO_ITEMS[0]);
    await todoTitle.expect.toHaveText([TODO_ITEMS[0]]);
    await newTodo.create(TODO_ITEMS[1]);
    await todoTitle.expect.toHaveText([TODO_ITEMS[0], TODO_ITEMS[1]]);
    await localStorageCount(2);
  });
  test("should clear text input field when an item is added", async ({
    todoPage: { newTodo, localStorageCount },
  }) => {
    await newTodo.create(TODO_ITEMS[0]);
    await newTodo.expect.toBeEmpty();
    await localStorageCount(1);
  });

  test("should append new items to the bottom of the list", async ({
    todoPage: {
      localStorageCount,
      newTodo,
      todoCount: { expect: expectTodo },
      todoTitles: { expect: expectTitle },
    },
  }) => {
    await newTodo.create(...TODO_ITEMS);
    await expectTodo.toHaveText("3 items left");
    await expectTodo.toHaveText("3 items left");
    await expectTodo.toContainText("3");
    await expectTodo.toHaveText(/3/);
    await expectTitle.toHaveText(TODO_ITEMS);
    await localStorageCount(3);
  });
});
test.describe("Mark all as completed", () => {
  test.beforeEach(async ({ todoPage: { newTodo, localStorageCount } }) => {
    await newTodo.create(...TODO_ITEMS);
    await localStorageCount(3);
  });

  test.afterEach(async ({ todoPage }) => {
    await todoPage.localStorageCount(3);
  });

  test("should allow me to mark all items as completed", async ({
    todoPage: {
      markComplete,
      items: { expect: expectItems },
      localStorageCount,
    },
  }) => {
    await markComplete.check();
    await expectItems.toHaveClass(["completed", "completed", "completed"]);
    await localStorageCount(3);
  });

  test("should allow me to clear the complete state of all items", async ({
    todoPage: { markComplete, items },
  }) => {
    await markComplete.check();
    await markComplete.uncheck();
    await items.expect.toHaveClass(["", "", ""]);
  });

  test("complete all checkbox should update state when items are completed / cleared", async ({
    todoPage: { markComplete, localStorageCount, items },
  }) => {
    const toggleAll = markComplete.getByLabel("Mark all as complete");
    await markComplete.check();
    await markComplete.expect.toBeChecked();
    await localStorageCount(3);

    // Uncheck first todo.
    const firstTodo = items.nth(0);
    await firstTodo.getByRole("checkbox").uncheck();

    // Reuse toggleAll locator and make sure its not checked.
    await toggleAll.expect.not.toBeChecked();

    await firstTodo.getByRole("checkbox").check();
    await localStorageCount(3);

    // Assert the toggle all is checked again.
    await toggleAll.expect.toBeChecked();
  });
});
