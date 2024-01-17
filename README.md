# Autometa

[Full Docs](https://bendat.github.io/autometa/docs/cucumber/test_runner/intro/)

# NOTICE

Autometa is under construction. It is currently unstable, poorly documented and not production ready for most cases.

Check back soon.

The following libraries may be considered relatively stable, but may contain bugs or unclear errors

- [Overloaded](libraries/overloaded/) - Function and method overloads that are as pleasant to make as they are to use
- [Bind Decorator](libraries/bind-decorator/) - Binds the `this` keyword on a class method. Respectfully a fork of [bind-decorator](https://www.npmjs.com/package/autobind-decorator)
- [Status Codes](libraries/status-codes/) - Object containing HTTP status
codes and status messages, visible in the editor via `as const`

# Autometa

_Autometa_ is an early-development automation framework toolkit, which provides libraries to help automate the automation process on node with libraries to
help bootstrap your node automation framework, for API or E2E testing.

[Full Docs](https://bendat.github.io/autometa/docs/cucumber/test_runner/intro/)


## Cucumber Runner

The Cucumber Runner lets you build and execute Cucumber style tests with alternative test runners. Currently supported are `jest` and `vitest`. Mocha
likely works but has not been tested.

Initially inspired by [jest-cucumber](github.com/bencompton/jest-cucumber) provides a customizable hybrid approach between cucumbers flat global steps
and jest-cucumbers nested spec-like tests.

Dependency injection is supported to make initializing client classes needed to interface with your service or website simple and logic-free, with unique copies
provided to each executing tests.

```ts title='Cucumber like'
import { Feature, Given, When, Then, Before } from "@autometa/runner";
import { App } from "./my-app";
import * as seedData from "./seed-data";

Before("Seed the database", async ({ dbClient }) => {
  await dbClient.seed(seedData);
});
Given("a user who wants to log in", () => {});
Given("I have {int} cats", (catCount) =>{}); // `catCount` is automatically inferred as `number`
When("a user submits their credentials", () => {});
Then("a user sees their", () => {});

// tests assembled automatically
Feature("./my-feature.feature");
```

Steps can also be nested or groups to override higher level
steps.

```ts title='Jest-Cucumber like'
import {
  Feature,
  Given,
  When,
  Then,
  Before,
  ScenarioOutline,
  Scenario,
  Rule,
} from "@autometa/cucumber-runner";
import { App } from "./my-app";
import * as seedData from "./seed-data";

Before("Seed the database", async ({ dbClient }: App) => {
  await dbClient.seed(seedData);
});
Given("a user who wants to log in", () => {});
When("a user submits their credentials", () => {});

Feature(() => {
  Scenario("a user logs in successfully", () => {
    Then("a user sees their profile", () => {});
  });

  Scenario("a user cannot log in without a password", () => {
    Then(
      "a user is informed they cannot log in",
      (expectedError: string) => {}
    );
  });
  Rule("a rule", () => {
    ScenarioOutline("some outline", () => {
      // define steps unique to `some outline`
    });
  });
}, "./my-feature.feature");
```

## Dto Builder

Implementation of the Builder pattern that allows automatically generating
builder classes from a DTO class prototype, with type-safe builder methods in
place of DTO properties.

```ts
import { dto, Builder } from '@autometa/dto-builder'
export class UserDto {
    id: number
    username: string,
    // default values, factories, dtos
    @DTO.dto(AddressDto)
    address: AddressDto
    @DTO.date()
    createdAt: Date
}
// or 
// avoid duplicating interface properties
export class UserDto extends DTO<IUser> {}

const UserDtoBuilder = Builder(UserDto);

const user = new UserDtoBuilder().id(1).name('bob').build()

// compilation error, 'first argument of "id" must be a number"
 new UserDtoBuilder().id('1').name('bob').build()
 // force it to pass a string
 new UserDtoBuilder().id('1' as unknown as number).name('bob').build()
```
