Feature: My Feature with a Rule

  Rule: This is my rule

    Scenario: A Rule Scenario
      Given a test

    Scenario Outline: an outline
      Given <number> chickens

      Examples: 
        | number |
        |      4 |
        |      5 |

  Rule: Yet Another Rule

    Scenario: Another Rule Scenario
      Given a test
