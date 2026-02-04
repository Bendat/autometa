Feature: Backoffice reports

  Scenario: Reports module steps run
    Given the backoffice steps are loaded
    And the reports module is discoverable
    Then the backoffice steps should be available
    And the reports module steps should run
