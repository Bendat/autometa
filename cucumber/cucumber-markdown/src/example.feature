@example
Feature: Gherkin example
    This example is used for feature-to-md testing

    # commet outer


    Background: setup
        A Background Description
        Given setup is set up
            | data1 | data 2 |
        And setup is set up
            | data1 |

        When anuther
            """ts
            class Foo {

            }
            """
        Then a brother
            """text
            I got my docstring
            """

    @foo @bar @baz
    Scenario: A Scenario
        # commet scenario
        Given a me, mario
        # commet outer
        When foo
    @example @scenario
    Scenario Outline: Application should perform the requested function
        This is a simple Scenario Outline example.

        Roight
        Given the application is started
            | name  | blame |
            | grame | shame |
        And the inputs are provided
        When the requested function is invoked with <input>
        Then the result is <output>

        @foo
        Examples: inputs/outputs
            These are the basic examples
            | input | output  |
            | one   | two     |
            | two   | "three" |
            | three | 7even   |

        @bar
        Examples: inputs/outputs
            These are the advanced examples
            | input | output |
            | 4     | 5      |
            | 6     | "7"    |
            | 2     | 2      |

    Rule: A Rule
        @foo @bar @baz
        Scenario: A Scenario
            # commet scenario
            Given a me, mario
            # commet outer
            When foo


    Rule: A Rule 2
        @foo @bar @baz
        Scenario: A Scenario
            # commet scenario
            Given a me, mario
            # commet outer
            When foo