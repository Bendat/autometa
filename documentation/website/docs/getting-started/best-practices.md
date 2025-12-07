---
sidebar_position: 4
---

# Best Practices

To get the most out of Autometa, follow these guidelines for structuring your tests and managing state.

## 1. Keep Steps Simple

Step definitions should be thin wrappers around your application logic. Avoid putting complex business logic directly in your steps.

**Bad:**
```ts
When("I calculate the total", (world) => {
  let total = 0;
  for (const item of world.cart) {
    if (item.price > 100) {
      total += item.price * 0.9; // logic in step
    } else {
      total += item.price;
    }
  }
  world.total = total;
});
```

**Good:**
```ts
When("I calculate the total", (world) => {
  world.total = world.app.cartService.calculateTotal(world.cart);
});
```

## 2. Use the World for State

Avoid global variables. Store all scenario-specific state in the `World` object. This ensures that tests are isolated and can run in parallel.

```ts
// autometa.config.ts
export default defineConfig({
  default: {
    // ...
    providers: {
      user: "./src/providers/user-provider.ts"
    }
  }
});
```

## 3. Leverage Dependency Injection

Use the `app` composition root to manage your services and clients. This makes it easier to mock dependencies and keep your tests modular.

```ts
// src/composition/app.ts
export class App {
  constructor(
    readonly apiClient: ApiClient,
    readonly db: Database
  ) {}
}
```

## 4. Use DTO Builders for Test Data

Use `DtoBuilder` to create consistent and valid test data. This avoids brittle tests that break when your data models change.

```ts
const user = userBuilder.create()
  .name("Test User")
  .build();
```

## 5. Write Declarative Scenarios

Gherkin scenarios should describe *what* the system does, not *how* it does it. Use business language rather than technical details.

**Bad:**
```gherkin
Given I click the button with ID "submit-btn"
Then the element ".success-message" should be visible
```

**Good:**
```gherkin
When I submit the form
Then I should see a success message
```
