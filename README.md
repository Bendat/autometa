# Autometa

_Autometa_ is intended to be an automation framework toolkit, which provides libraries to help automate the automation process on node, by providing libraries to help bootstrap an automation framework
suited to your own product. This is not an automation framework of itself.

Below is a summary of Autometa Libraries

## BDD

### Cucumber Runner

[Autometa Cucumber](1_bdd/cucumber/1_intro.md) is a Cucumber test runner inspired by [jest-cucumber](https://github.com/bencompton/jest-cucumber).
It is a structured cucumber implementation that runs tests in callbacks similar to a Jest or Mocha `describe` spec test.

```ts title=Example
Feature(({ Scenario }) => {
  Scenario('My Scenario', ({ Given, When, Then }) => {
    Given('my given step', () => console.log('given step executed'));
    When('my when step', () => console.log('when step executed'));
    Then('my then step', () => console.log('then step executed'));
  });
});
```

Support for more global, dynamic step/feature definitions similar to default Cucumber or [cucumber-tsflow](https://github.com/timjroberts/cucumber-js-tsflow) is planned.

Currently depends on Jest, with goals to be test runner agnostic.

## UI Automation

### Page Component Model - Selenium

[Page Component Model](./ui-testing/page-component-model/intro) is a [Page Object Model](https://www.selenium.dev/documentation/test_practices/encouraged/page_object_models/) library
that aims to simplify creating page objects by introducing the concept of components, in alignment with popular front end framework concepts.

The Page Component Model library allows page objects to be written declaratively, with minimal logic and zero instantiation. WebElements
are automatically picked and loaded based on statically defined information and reflection metadata. They are lazy (connect to selenium only when requested) and scoped (Components will always be located under their parent Components underlying WebElement, only using the WebDriver if the parent is a Page)

_Implementations for other drivers, like PlayWright and Cypress is planned_

### User Behaviors
[User Behaviors](./ui-testing/user-behaviors/intro) are an abstraction layer on top of
Page Component which focus on how a user interacts with a Website, compared to Page Components which
describe how a Website is structured.

User Behaviors allow declarative interaction with a Website and use easy to read chains
of actions to complete.
```ts
export const LoginComponent = Observe(HomePage, ({ loginModal }) => loginModal);

export const LogInAs = ({ username, password }: Credentials) =>
  ActionOn(
    LoginComponent,
    async ({ usernameField, passwordField, loginButton }) => {
      await usernameField.write(username);
      await passwordField.write(password);
      await loginButton.click();
    }
  );

// Example Credentials Store somewhere in your project
export const credentials = {
  Johnny: { username: 'johnnym2', password: '*******' },
};

@Browser(new Builder().forBrowser(Browser.CHROME))
export class Users {
  @Role('Customer') // Use roles that are relevant to your product
  @Browses(process.env.MY_URL)
  Johnny: User;
}

describe('Johnny Logs In', () => {
  let Johnny: Participant;
  // instantiate a new community for each test, Johnny will load a driver
  beforeEach(async () => ({ Johnny } = await FocusGroup.begin(Users)));
  // Exit the driver
  afterEach(async () => Johnny.finish());

  it('Johnny Should Successfully Log In as a Standard User', async () => {
    await Johnny
    .will(LoginAs(credentials.Johnny))
    .and.see(HomePage, HasTitle('Welcome, Johnny!'));
  });
});
```
## Utility Libraries

### DTO & Builder Pattern

[**D**ata **T**ransfer **O**bjects](https://en.wikipedia.org/wiki/Data_transfer_object) are simple classes with the `@property` decorator on properties. They can easily be validated with [class-validators](https://github.com/typestack/class-validator).

[Builder Pattern](https://en.wikipedia.org/wiki/Builder_pattern) is a chainable proxy object for a DTO with setter-methods and a`build` method. This library can automatically generate a corresponding builder class for a valid DTO.

```ts title=Example
import {property, Builder} from '@autometa/dto-builder`

class MyDTO {
    @property
    username: string

    @property
    password: string
}

const MyDTOBuilder = Builder(MyDTO)

const myBuilderInstance = new MyDTOBuilder();

const dto = myBuilderInstance.username('bob').password('123456').build()

myHttpClient.post('/my-route', dto)
```

### Logger Groups

Provides behavior similar to `console.group` on the browser, in Node.
Can be accessed through either `GroupLogger` or by overriding the `console`.

Not suitable for concurrent tests or asynchronous actions (groups may _contain_ asynchronous actions)

```sh title='Example Log'
Feature: Some Feature
    Scenario: Some Scenario
        Given some given step
            [Log]
            some user generated log
            /path/to/log:8:40
        When some when step
            [Info]
            http client recieved response: {message: 'howdy'}
            /path/to/log:11:9

```
