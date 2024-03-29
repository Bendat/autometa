Feature: A Nested Feature With Hook Areas
  @skipHook
  Scenario: Outer Hook Scenario
    Given a scenario with hooks

  Scenario Outline: Outer Hook Scenario Outline
    Given a scenario with hooks

    Examples: 
      | Foo | Bar |
      |   1 |   2 |

  Rule: A Rule with hooks

    Scenario: Inner Hook Scenario
      Given a scenario with hooks

    Scenario Outline: Inner Hook Scenario Outline
      Given a scenario with hooks

      Examples: 
        | Foo | Bar |
        |   1 |   2 |
