Feature: Basic arithmetic operations
  As a user
  I want to perform basic math
  So that I can verify the calculator works

  Scenario: Addition
    Given I have the number 5
    When I add 3
    Then the result should be 8

  Scenario: Multiplication
    Given I have the number 4
    When I multiply by 3
    Then the result should be 12

  Scenario: Combined operations
    Given I have the number 10
    When I add 5
    And I multiply by 2
    Then the result should be 30
