Feature: Multiple Scenarios
    Scenario: First Scenario
        Given 1 dingo

    Scenario: Second Scenario
        Given 2 dingos

    Scenario Outline: An Outline
        Given a <thing>

        Examples:
            | thing |
            | road  |
            | track |