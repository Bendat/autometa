import { test as base } from "@playwright/test";
import { PageComponent } from "../src";
import { TodoPage } from "./example.components";
export const test = base.extend({
    todoPage: async ({ page }, use) => {
        const todoPage = PageComponent.browse(TodoPage, page.locator("body"));
        await use(todoPage);
    },
});
