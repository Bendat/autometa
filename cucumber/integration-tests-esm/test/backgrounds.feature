Feature: A Feature with a background
    Background: Feature Level Background
        Given a background step
    
    Scenario: Outter Scenario
        Given a scenario step
    
    Rule: A Rule
        Background: Rule Background
            Given a rule background step

        Scenario: Rule Scenario
            Given a rule scenario step