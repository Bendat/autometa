Feature: Inspect Autometa lifecycle metrics
  Autometa's scope lifecycle keeps feature and step level metadata.
  This example demonstrates using feature and step hooks to expose that data to steps.

  Scenario: Capture lifecycle details within a scenario
    When I request the menu listing
    Then the lifecycle should have recorded 1 feature setup runs
    And the lifecycle scenario order should equal:
      | scenario                                      |
      | Capture lifecycle details within a scenario |
    And the lifecycle should record the following step outcomes:
      | step                                             | status |
      | When I request the menu listing                  | passed |
