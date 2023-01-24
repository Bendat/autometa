# Automatic Scenarios

It is possible to avoid writing individual scenarios and outlines for a feature file by using the `All` function provided by `Feature`

Imagine the following feature file:

```gherkin
Feature: A Feature
    Scenario: Alphabets
        Given A
        When B
        Then C

    Scenario: Betaalphs
        Given A
        When F
        Then D

    Scenario: Letters
        Given P
        When B
        Then C
```

These Scenarios share multiple steps which cannot be wrapped in a background.

To reduce code use and nesting, it's possible to define **Top Level Steps** instead.

Top Level Steps will be assembled into the correct scenarios automatically at run time.

Top Level Steps are defined with the `All` callback function,

```ts
Feature(({ All }) => {
  All(({ Given, When, Then }) => {
    Given('A', () => {});
    Given('A', () => {});
    When('B', () => {});
    When('F', () => {});
    Then('C', () => {});
    Then('D', () => {});
  });
}, './sample.feature');
```

Top Level Steps will run _all_ scenarios possible in a feature file, including rules.
