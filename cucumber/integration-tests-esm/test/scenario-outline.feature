Feature: Scenario Outlines
    Scenario Outline: Basic Scenario Outline
        Given a <age> year old <thing>

        Examples: Common Animals
            | age | thing       |
            | 23  | man         |
            | 45  | tree        |
            | 32  | Jira Ticket |


    Scenario Outline: Multiple Examples
        Given a <color> <animal>

        Examples: Common Animals
            | color | animal |
            | white | rabbit |
            | red   | dog    |

        Examples: Demonimals
            | color | animal    |
            | red   | hellhound |
            | green | crocosaur |
