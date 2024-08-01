@UseGroupHooks
Feature: A Representitive feature
  Full scale test, rules, scenarios, scenario outlines

  Background: outerbackground
    Given the outer background executed

  @test1
  Scenario: outerscenario
    Given the outer scenario executed
  @test2
  Scenario Outline: outerscenariooutline
    * I execute the outer scenario with <param>

    Examples:
      | param |
      | 1     |
      | 1     |
      | 1     |
  @test3
  Scenario: outerscenario2
    Given the outer scenario 2 executed

  @skipped
  Scenario: outerskippedScenario
    Given the outer skipped scenario executed

  Rule: rule1
    Background: rule1background
      Given the rule1 background executed
    @test4
    Scenario: rule1scenario
      Given the rule1 scenario executed

  Rule: rule2
    Background: rule2background
      Given the rule2 background executed
    @test5
    Scenario: rule2scenario
      Given the rule2 scenario executed

    @skipped
    Scenario: rule2skippedScenario
      Given the rule2 skipped scenario executed

    Scenario Outline: Rule Scenario Outline <count>
      Given a rule scenario outline
      * a table to test
        | count <count> |
        | foo <count>        |

      Examples: Examples A
        | count |
        | 1     |
        | 2     |

      Examples: Examples B
        | count |
        | 3     |
        | 4     |