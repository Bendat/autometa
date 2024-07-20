Feature: Feature with Scenario Outline

    Scenario Outline: A Scenario Outline <thing> <count> <thing>
        Given an outline parameter <thing> <thing>
        When another outline parameter <count>

        Examples:
            | thing | count |
            | one   | 1     |
            | three | 3     |

