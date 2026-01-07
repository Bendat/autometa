Feature: Backoffice - Reports module discovery
  Scenario: Discover backoffice/reports steps and features
    Given the backoffice reports module is discoverable
    Then the backoffice reports module steps should run
