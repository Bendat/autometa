Feature: My Feature
    Scenario: A Scenario
        Given a setup step
        When an action step
        Then a validation step

    Scenario: A Scenario with and
        Given a setup step
        And a conjunction
        When an action step
        Then a validation step

    Scenario: A Scenario with but
        Given a setup step
        But a conjunction
        When an action step
        Then a validation step

    Scenario: A Scenario with a list
        Given a setup step
        * another setup step
        * a third setup step
        When an action step
        Then a validation step

