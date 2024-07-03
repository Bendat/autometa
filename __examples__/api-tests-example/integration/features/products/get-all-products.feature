Feature: View all available products

    Scenario: I can view all available products
        When I view all products
        Then the products list limit is 30
        And the products list total is 194
        * the products list skip is 0
   
    Scenario: I can see the Essence Mascara Lash Princess is the first product
        When I view all products
        Then the 1st product title is 'Essence Mascara Lash Princess'
        And the product price is 9.99
        * the product 'discount percentage' is 7.17
        * the product brand is 'Essence'