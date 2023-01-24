Feature: A Feature
    Rule: No Dancing In The Halls
        Scenario: Attempting to Dance in Hall Fails
            Given me, dancing
            When I enter the hall
            Then I am blown up