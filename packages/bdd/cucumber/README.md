# Autometa Cucumber

**Full Documentation/Getting Started can be [found here](https://bendat.github.io/autometa/docs/bdd/cucumber/intro/)**

Autometa is an Cucumber alternative inspired by [jest-cucumber](https://github.com/bencompton/jest-cucumber) using structured tests that closely resemble their original feature file counterpart.

## Preview

Assuming the following feature file:

```gherkin title='Create a feature file'
Feature: Registering

    Background: Provide password
        Given a provided password 'password1234'

    Scenario: A user registers
        Given a provided username 'frankie2'
        When the user registers
        Then they are shown their profile

    Rule: A username cannot contain special characters
        Scenario Outline: A user cannot register with a special character
            Given a provided username '<username>'
            When the user registers
            Then they are displayed an error
                | message                                      |
                | A username cannot contain special characters |

            Examples:
                | username  |
                | frankie2; |
                | frankie2, |
                | frankie2" |
```

We can create our test:

```ts title="Step Definitions"
import { UserDriver } from '../fugazi-ui-drivers';
import { Feature } from '@autometa/cucumber';

Feature(({ Background, Scenario, Rule }) => {
  let user: UserDriver;
  beforeEach(() => {
    user = new UserDriver();
  });

  Background(({ Given, When }) => {
    Given('a provided password {string}', (password: string) => {
      user.setPassword(password);
    });

    // steps can be run in background even if not defined so
    // in gherkin. This way we can take advantage of cucumber
    // expressions and/or regex
    Given('a provided username {string}', (username: string) => {
      user.setUsername(username);
    });

    When('the user registers', async () => {
      await user.performRegistration();
    });
  });

  Scenario('A user registers', ({ Then }) => {
    Then('they are shown their profile', () => {
      user.verifyProfile();
    });
  });

  Rule(
    'A username cannot contain special characters',
    ({ ScenarioOutline }) => {
      ScenarioOutline(
        'A user cannot register with a special character',
        ({ Then }) => {
          Then('they are displayed an error', (table: GherkinTable) => {
            user.verifyError(table);
          });
        }
      );
    }
  );
}, './sample.feature');
```
