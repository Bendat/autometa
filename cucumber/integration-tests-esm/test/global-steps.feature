Feature: Test Global Steps
    Scenario: First Scenario
        Given a dog

    Rule: A Rule
        Scenario Outline: First Outline
            When a rabbit, <name>, kills
            Examples:
                | name  |
                | frank |