var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { SemanticComponent, ByTestId, PageComponent, ByPlaceholder, ByLabel, } from "../src";
export class TodoInput extends SemanticComponent {
    async create(...items) {
        for (const item of items) {
            await this.fill(item);
            await this.press("Enter");
        }
    }
}
export class TodoPage extends SemanticComponent {
    constructor() {
        super(...arguments);
        this.localStorageCount = async (expected) => {
            return await this.page().waitForFunction((e) => {
                return JSON.parse(localStorage["react-todos"]).length === e;
            }, expected);
        };
    }
}
__decorate([
    ByTestId("todo-title"),
    __metadata("design:type", PageComponent)
], TodoPage.prototype, "todoTitles", void 0);
__decorate([
    ByPlaceholder("What needs to be done?"),
    __metadata("design:type", TodoInput)
], TodoPage.prototype, "newTodo", void 0);
__decorate([
    ByLabel("Mark all as complete"),
    __metadata("design:type", PageComponent)
], TodoPage.prototype, "markComplete", void 0);
__decorate([
    ByTestId("todo-count"),
    __metadata("design:type", PageComponent)
], TodoPage.prototype, "todoCount", void 0);
__decorate([
    ByTestId("todo-item"),
    __metadata("design:type", PageComponent)
], TodoPage.prototype, "items", void 0);
