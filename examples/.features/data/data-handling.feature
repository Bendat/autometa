Feature: Share recipe knowledge through data tables
  Brew Buddy crafts consistent drinks by following structured recipes and sharing tasting notes.

  Background:
    Given the Brew Buddy menu is reset to the default offerings

  Scenario: Import multiple recipes using a data table
    When I register the following recipes
      | name          | base     | additions         |
      | Honey Latte   | espresso | honey, nutmeg     |
      | Citrus Coldie | cold brew| orange, tonic     |
    Then each recipe should exist in the recipe catalog
    And the recipe "Honey Latte" should list "honey" as an addition
    And I log the current step metadata

  Scenario: Use a doc string to capture tasting notes
    When I attach tasting notes for "Flat White"
      """
      Texture: Silky and velvety
      Sweetness: Balanced by microfoam
      Finish: Toasted almond with light citrus
      """
    Then the recipe "Flat White" should store the tasting notes

  Scenario Outline: Generate brew ratios for pour-over recipes
    When I calculate brew ratio for "<bean>"
      | coffee grams | <coffee> |
      | water grams  | <water>  |
    Then the brew ratio should equal <ratio>

    Examples:
      | bean        | coffee | water | ratio |
      | Kenya AA    | 25     | 400   | 1:16  |
      | Ethiopia Guji | 28   | 420   | 1:15  |
      | Colombia Huila | 30 | 450   | 1:15  |
