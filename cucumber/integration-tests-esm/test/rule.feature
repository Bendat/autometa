Feature: My Feature with a Rule

  Rule: This is my rule

    Scenario: A Scenario
      Given a test

    Scenario Outline: 
      Given <number> chickens

      Examples: 
        | number |
        |      4 |
        |      5 |

  Rule: Yet Another Rule

    Scenario: A Scenario
      Given a test
