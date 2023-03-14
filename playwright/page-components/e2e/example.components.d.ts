import { SemanticComponent, PageComponent } from "../src";
export declare class TodoInput extends SemanticComponent {
    create(...items: string[]): Promise<void>;
}
export declare class TodoPage extends SemanticComponent {
    todoTitles: PageComponent;
    newTodo: TodoInput;
    markComplete: PageComponent;
    todoCount: PageComponent;
    items: PageComponent;
    localStorageCount: (expected: number) => Promise<import("@playwright/test").JSHandle<false> | import("@playwright/test").JSHandle<true>>;
}
//# sourceMappingURL=example.components.d.ts.map