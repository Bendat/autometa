Feature: Fulfil customer beverage orders
  Guests place drinks from the Brew Buddy menu. Orders drive preparation timing, payment, and loyalty rewards.

  Background:
    Given the Brew Buddy menu is reset to the default offerings
    And the order queue is cleared

  Scenario: Submit a single drink order
    When I place an order for "Flat White"
      | size  | 12oz |
      | shots | 2    |
    Then the order response should include a preparation ticket
    And the order status should be "queued"

  Scenario Outline: Customise milk and sweetener preferences
    When I place an order for "<drink>"
      | size      | <size>      |
      | milk      | <milk>      |
      | sweetener | <sweetener> |
    Then the order should record the milk as "<milk>"
    And the order should record the sweetener as "<sweetener>"

    Examples:
      | drink          | size | milk         | sweetener |
      | Iced Cold Brew | 16oz | oat          | vanilla   |
      | Espresso       | 2oz  | whole        | none      |
      | Flat White     | 12oz | almond       | honey     |

  Scenario: Capture payment and loyalty points
    Given a loyalty account exists for "lena@example.com"
    When I place and pay for an order
      | drink  | Espresso |
      | size   | single   |
      | method | tap      |
    Then the loyalty account should earn 10 points
    And the order status should be "paid"

  Scenario Outline: Reject orders when inventory is depleted
    Given the inventory for "<item>" is set to <remaining> drinks
    When I place an order for "<item>"
      | size | <size> |
    Then the order should be rejected with status 409
    And the rejection reason should be "Inventory depleted for <item>"

    Examples:
      | item           | size | remaining |
      | Espresso       | 8oz  | 0         |
      | Iced Cold Brew | 16oz | 0         |
