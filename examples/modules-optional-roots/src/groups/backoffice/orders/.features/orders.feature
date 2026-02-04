Feature: Backoffice orders

  Scenario: Orders module steps run
    Given the backoffice steps are loaded
    And the orders module is discoverable
    Then the backoffice steps should be available
    And the orders module steps should run
