Feature: My Sample Feature
    This is a description of the Feature Under Test
    - bullet point 1
    - bullet point 2

  Scenario: Outer Scenario
    Given a foo

  Scenario Outline: An Outline
    A description
    Given a <proo>

    Examples: 
      | proo |
      |    2 |

  Rule: If there is a Rule, then it will become a subsection
        This is a description of that rule

    Scenario: A Chicken, A Donkey and a Priest Walk Into A Bar
            This is a test description

      Given a step with a table:
        | user    | age |
        | john    |   5 |
        | tabatha |  12 |
      When something happens
      Then a validation can be done
