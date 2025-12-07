Feature: Interact with the Brew Buddy API
  Autometa's HTTP client enables readable API requests within steps.

  Background:
    Given the Brew Buddy API base URL is configured

  @http
  Scenario: Fetch menu catalog via GET
    When I send a GET request to "/menu"
    Then the response status should be 200
    And the response status should not be 404
    And the response json should match the default menu snapshot

  @http
  Scenario: Create a new recipe via POST
    When I send a POST request to "/recipes"
      """
      {
        "name": "Lavender Latte",
        "base": "espresso",
        "additions": ["lavender", "oat milk"],
        "season": "Spring"
      }
      """
    Then the response status should be 201
    And the response header "location" should start with "/recipes/"

  @http
  Scenario Outline: Update stock levels with PATCH
    When I send a PATCH request to "/inventory/<item>"
      """
      {
        "quantity": <quantity>
      }
      """
    Then the response status should be 200
    And the response json should contain
      | path      | value     |
      | item      | <item>    |
      | quantity  | <quantity> |

    Examples:
      | item           | quantity |
      | espresso-shot  | 120      |
      | cold-brew      | 80       |

  @http
  Scenario: Handle error responses gracefully
    When I send a DELETE request to "/inventory/non-existent"
    Then the response status should be 404
    And the response json should contain
      | path   | value                     |
      | error  | NOT_FOUND                 |
      | reason | Inventory item not found  |
