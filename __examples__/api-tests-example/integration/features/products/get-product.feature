Feature: Viewing a Product
    @abc
    Scenario: I view an iPhone (builder)
        Given I want to view the product 'iPhone 9'
        When I view the product
        Then the product description is "An apple mobile which is nothing like apple"
        And the product price is 549
        * the product 'discount percentage' is 12.96
        * the product brand is 'Apple'


    Scenario: I view an iPhone (table)
        Given I want to view the product 'iPhone 9'
        When I view the product
        Then the product has the expected details
            | description | An apple mobile which is nothing like apple |
            | price       | 549                                         |
            | discount    | 12.96                                       |
            | brand       | Apple                                       |