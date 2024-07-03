Feature: Modify the App from an expression transform
  Scenario: Modify the app
    When I modify the app with 'hello world'
    Then the world contains 'hello world'