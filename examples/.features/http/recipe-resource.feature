Feature: Manage recipes through the Brew Buddy API
  The recipe catalog enables baristas to share drinks across locations. We manage recipes via HTTP endpoints.

  Background:
    Given the Brew Buddy API base URL is configured

  Rule: Creating recipes requires complete definitions
    Scenario Outline: Create a recipe with required fields
      When I send a POST request to "/recipes"
        """
        {
          "name": "<name>",
          "base": "<base>",
          "additions": <additions>,
          "season": "<season>"
        }
        """
      Then the response status should be 201
      And the response header "location" should equal "/recipes/<slug>"
      And the response json should contain
        | path        | value     |
        | name        | <name>    |
        | base        | <base>    |
        | season      | <season>  |
        | isSeasonal  | <seasonal> |

      Examples:
        | name            | base     | additions                                   | season | slug             | seasonal |
        | Lavender Latte  | espresso | ["lavender", "oat milk"]                    | Spring | lavender-latte   | true     |
        | Classic Mocha   | espresso | ["cocoa", "steamed milk", "vanilla"]       | None   | classic-mocha    | true     |

    Scenario: Reject incomplete recipe payload
      When I send a POST request to "/recipes"
        """
        {
          "name": "Half Baked",
          "base": "",
          "additions": []
        }
        """
      Then the response status should be 422
      And the response json should contain
        | path          | value                     |
        | error         | VALIDATION_ERROR          |
        | details.base  | BASE_REQUIRED             |

  Rule: Reading recipes returns consistent representations
    Scenario: List all recipes
      When I send a GET request to "/recipes"
      Then the response status should be 200
      And the response json should contain an array at path "recipes"
      And each recipe should include fields "name", "base", "additions", "season"

    Scenario: Retrieve a specific recipe by slug
      Given a recipe exists named "Lavender Latte"
      When I send a GET request to "/recipes/lavender-latte"
      Then the response status should be 200
      And the response json should contain
        | path             | value             |
        | name             | Lavender Latte    |
        | base             | espresso          |
        | additions[0]     | lavender          |
        | additions[1]     | oat milk          |

  Rule: Updating recipes supports partial changes
    Scenario Outline: Patch a recipe field
      Given a recipe exists named "<name>"
      When I send a PATCH request to "/recipes/<slug>"
        """
        {
          "<field>": <value>
        }
        """
      Then the response status should be 200
      And the response json should contain
        | path        | value |
        | <fieldPath> | <value> |

      Examples:
        | name           | slug             | field        | value                         | fieldPath         |
        | Lavender Latte | lavender-latte   | season       | "Summer"                     | season            |
        | Classic Mocha  | classic-mocha    | additions    | ["cocoa", "espresso", "cream"] | additions         |
        | Classic Mocha  | classic-mocha    | base         | "cold brew"                  | base              |

    Scenario: Reject patch with unknown fields
      Given a recipe exists named "Lavender Latte"
      When I send a PATCH request to "/recipes/lavender-latte"
        """
        {
          "unknown": "value"
        }
        """
      Then the response status should be 400
      And the response json should contain
        | path   | value           |
        | error  | UNSUPPORTED_KEY |

  Rule: Deleting recipes cleans dependent data
    Scenario: Delete a recipe
      Given a recipe exists named "Classic Mocha"
      When I send a DELETE request to "/recipes/classic-mocha"
      Then the response status should be 204
      And the recipe "Classic Mocha" should not be present when I list recipes

    Scenario: Deleting a missing recipe returns 404
      When I send a DELETE request to "/recipes/non-existent"
      Then the response status should be 404
      And the response json should contain
        | path   | value        |
        | error  | NOT_FOUND    |
        | reason | Recipe not found |
