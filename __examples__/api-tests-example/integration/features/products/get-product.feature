Feature: Viewing a Product
    @abc
    Scenario: I view an iPhone (builder)
        Given I want to view the product 'iPhone 9'
        When I view the product
        Then the product description is "The Essence Mascara Lash Princess is a popular mascara known for its volumizing and lengthening effects. Achieve dramatic lashes with this long-lasting and cruelty-free formula."
        And the product price is 9.99
        * the product 'discount percentage' is 7.17
        * the product brand is 'Essence'


    Scenario: I view an iPhone (table)
        Given I want to view the product 'iPhone 9'
        When I view the product
        Then the product has the expected details
            | description | The Essence Mascara Lash Princess is a popular mascara known for its volumizing and lengthening effects. Achieve dramatic lashes with this long-lasting and cruelty-free formula. |
            | price       | 9.99                                         |
            | discount    | 7.17                                      |
            | brand       | Essence                                       |