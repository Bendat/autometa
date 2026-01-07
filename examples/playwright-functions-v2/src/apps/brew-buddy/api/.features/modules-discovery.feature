Feature: Module-scoped discovery
  Scenario: Discover features via module-relative roots
    Given a module-scoped feature exists
    Then it should be discovered via module-relative roots
