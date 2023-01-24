Feature: With Background
    Background: A named background
        Given a holly

    Rule: I Am A Rule
        Background: 
            Given a jolly

        Scenario: A Rule Applies
            When a Christmas
            Then everybody gives a cheer