Feature: Control scenario execution via tags
  Tags help teams orchestrate which scenarios run in different pipelines.

  @tags @documentation
  Scenario: List available tag conventions
    When I inspect the tag registry
    Then I should see the following tag groups
      | tag       | description                                      |
      | @smoke    | Core happy-path scenarios                        |
      | @regression | Extended coverage for releases                 |
      | @http     | Scenarios that call the API                      |
      | @skip     | Temporarily disabled scenarios                   |
      | @only     | Scenarios to focus on during local development   |

  @skip
  Scenario: Demonstrate a skipped scenario
    Given this scenario is intentionally skipped
    When the runner evaluates tags
    Then this scenario should not execute

  @only
  Scenario: Focus execution during triage
    Given this scenario is under investigation
    When I run the suite with focus enabled
    Then only this scenario should execute

  @http
  Scenario Outline: Filter scenarios by tag expression
    When I run the features with tag expression "@http and not @skip"
    Then the selected scenarios should include "<scenario>"

    Examples:
      | scenario                        |
      | Retrieve the published menu     |
      | Submit a single drink order     |
      | Capture payment and loyalty points |
