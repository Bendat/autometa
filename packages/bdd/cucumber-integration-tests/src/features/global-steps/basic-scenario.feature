Feature: A Can Log In To Their Account
    Scenario: A User Successfully Logs In
        Given a registered user
        When they enter their username 'jerry'
        And they enter their password '1234s5'
        Then they are presented with their profile

    # Scenario Outline: A User Attempts To Log In With Wrong Password
    #     Given a registered user
    #     When they enter their username 'jerry'
    #     But they enter their password '<wrong>'
    #     Then an error is displayed

    #     Examples:
    #         | wrong |
    #         | 1234  |
    #         | 4321  |
            
    # Rule: A user can use their email instead of password
    #     Scenario: A User Successfully Logs In With Their Email Address
    #         Given a registered user
    #         When they enter their username 'jerrys'
    #         And they enter their password '12345'
    #         Then they are presented with their profile