Feature: Feature with Scenario Outline

    Scenario Outline: A Scenario Outline
        Given an outline parameter <thing>
        When another outline parameter <count>

        Examples:
            | thing | count |
            | one   | 1     |
            | three | 3     |

