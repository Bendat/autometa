Feature: this is a test feature
  Background: this is a test background
    Given this is a test background step
  Rule: this is a test rule
    Background: this is a rule background
      Given this is a rule background step
    Scenario: this is a test scenario
      Given this is a test step

    Scenario Outline: this is a test scenario outline
      Given this is a test step with <parameter>
      
      Examples:
        | parameter |
        | value1    |
        | value2    |

    Scenario Outline: this is a test scenario outline with multiple example tables
      Given this is a test step with <parameter>

      Examples:
        | parameter |
        | valueA    |
        | valueB    |

      Examples:
        | parameter |
        | valueX    |
        | valueY    |
    Scenario: this is another test scenario
      Given this is another test step
