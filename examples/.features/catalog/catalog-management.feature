@sequential
Feature: Manage Brew Buddy menu catalog
  Brew Buddy keeps a curated coffee menu. Baristas manage items, prices, and seasonal availability.

  Background:
    Given the Brew Buddy menu is reset to the default offerings

  @smoke
  Scenario: Retrieve the published menu
    When I request the menu listing
    Then the response status should be 200
    And the menu should include the default drinks
      | name           | price | size   |
      | Espresso       | 3.00  | single |
      | Flat White     | 4.50  | 12oz   |
      | Iced Cold Brew | 5.00  | 16oz   |

  @regression
  Scenario Outline: Introduce a new seasonal beverage
    Given I create a seasonal drink named "<name>"
      | field       | value     |
      | price       | <price>   |
      | size        | <size>    |
      | description | <blurb>   |
      | season      | <season>  |
    When I request the menu listing
    Then the menu should include an item named "<name>" with price <price> and size "<size>"
    And the seasonal flag should be set to true

    Examples:
      | name              | price | size | blurb                    | season |
      | Golden Latte      | 5.75  | 12oz | Turmeric and honey latte | Fall   |
      | Midnight Mocha    | 6.25  | 16oz | Dark cocoa with espresso | Winter |
      | Citrus Cold Foam  | 5.95  | 16oz | Orange zest cold brew    | Summer |

  @skip
  Scenario: Remove a retired beverage
    Given a menu item named "Pumpkin Spice Latte" exists for season "Fall"
    When I retire the drink named "Pumpkin Spice Latte"
    Then the menu should not include "Pumpkin Spice Latte"
    And the response status should be 204

  @wip @only
  Scenario: Update pricing in bulk
    Given the following menu price changes are pending
      | name           | price |
      | Espresso       | 3.25  |
      | Flat White     | 4.75  |
      | Iced Cold Brew | 5.50  |
    When I apply the bulk price update
    Then each price change should be reflected in the latest menu

  @regression
  Scenario Outline: Seasonal availability matrix for <region>
    Given the seasonal schedule for <region> is configured
    When I request the menu listing for <region>
    Then the regional menu should include <expected>
    And the seasonal flag should reflect <seasonal>

    Examples: Domestic availability
      | region | expected        | seasonal |
      | East   | Golden Latte    | true     |
      | West   | Midnight Mocha  | true     |
      | North  | Flat White      | false    |

    Examples: International availability
      | region | expected        | seasonal |
      | EU     | Citrus Cold Foam| true     |
      | APAC   | Espresso        | false    |
