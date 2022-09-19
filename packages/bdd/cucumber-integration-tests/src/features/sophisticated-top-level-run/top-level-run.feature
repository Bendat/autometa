Feature: Bigger, Bolder, Top Level Run
    Scenario: First
        Given a 1
        When a bat
        Then a toyota

    Scenario Outline: Second
        Given a 2
        When a <animal> arrives
        Then a <car> leaves

        Examples:
            | animal | car    |
            | dog    | toyota |
            | cat    | audi   |

    Rule: Deeper...
        Scenario: Third
            Given a 1
            When a chicken
            Then a audi
