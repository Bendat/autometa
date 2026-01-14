Feature: Brew Buddy - Orders module discovery
  Scenario: Discover brew-buddy/orders steps and features
    Given the brew-buddy orders module is discoverable
    Then the brew-buddy orders module steps should run
