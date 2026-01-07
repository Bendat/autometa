Feature: Backoffice - Orders module discovery
  Scenario: Discover backoffice/orders steps and features
    Given the backoffice orders module is discoverable
    Then the backoffice orders module steps should run
