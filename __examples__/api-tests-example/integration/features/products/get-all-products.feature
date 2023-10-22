Feature: View all available products

    Scenario: I can view all available products
        When I view all products
        Then the products list limit is 30
        And the products list total is 100
        * the products list skip is 0
   
    Scenario: I can see the iPhone 9 is the first product
        When I view all products
        Then the 1st product title is 'iPhone 9'
        And the product price is 549
        * the product 'discount percentage' is 12.96
        * the product brand is 'Apple'