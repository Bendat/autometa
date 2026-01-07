Feature: Hoisted feature with grouped steps
  Scenario: Grouped-only step execution for a hoisted feature
    Given the grouped steps are loaded
    Then the grouped step should run
