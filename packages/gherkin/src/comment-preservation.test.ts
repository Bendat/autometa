import { describe, it, expect } from 'vitest';
import { parseGherkin, astToSimple } from './parsers';
import { simpleToAst } from './converters';
import { SimpleScenario, SimpleRule, SimpleRuleElement } from './types';

describe('Comment and Location Preservation', () => {
  it('should preserve comments and location metadata', () => {
    const gherkinWithComments = `
# Feature level comment
@feature-tag
Feature: Comment Preservation
  As a developer
  I want to preserve comments and location data
  So that I can provide better tooling

  # Background comment
  Background:
    # Step comment
    Given I have a system with comments

  # Scenario comment
  @scenario-tag
  Scenario: Basic comment preservation
    # Another step comment
    When I parse this feature
    Then comments should be preserved
    # Final comment
    And location data should be available

  # Rule comment
  Rule: Comments in rules work too
    # Scenario in rule comment
    Scenario: Scenario within rule
      Given a scenario in a rule
      When it has comments
      Then they are preserved too
`;

    const result = parseGherkin(gherkinWithComments);
    
    // Verify the feature has location data
    expect(result.location).toBeDefined();
    expect(result.location?.line).toBeGreaterThan(0);
    
    // Verify comments are captured
    expect(result.comments).toBeDefined();
    expect(result.comments?.length).toBeGreaterThan(0);
    
    // Check for specific comments
    const commentTexts = result.comments?.map(c => c.text) || [];
    expect(commentTexts).toContain('# Feature level comment');
    expect(commentTexts).toContain('  # Background comment');
    expect(commentTexts).toContain('  # Scenario comment');
    expect(commentTexts).toContain('  # Rule comment');
    
    // Verify background has location
    expect(result.background?.location).toBeDefined();
    expect(result.background?.location?.line).toBeGreaterThan(0);
    
    // Verify scenarios have location
    const scenario = result.elements?.find(el => 'steps' in el && !('exampleGroups' in el) && !('elements' in el)) as SimpleScenario;
    expect(scenario?.location).toBeDefined();
    expect(scenario?.location?.line).toBeGreaterThan(0);
    
    // Verify steps have location
    expect(scenario?.steps[0]?.location).toBeDefined();
    expect(scenario?.steps[0]?.location?.line).toBeGreaterThan(0);
    
    // Verify rules have location
    const rules = result.elements?.filter(el => 'elements' in el && Array.isArray(el.elements)) as SimpleRule[];
    expect(rules[0]?.location).toBeDefined();
    expect(rules[0]?.location?.line).toBeGreaterThan(0);
    
    // Verify scenarios within rules have location
    const ruleScenarios = rules[0]?.elements?.filter(el => 'steps' in el && !('exampleGroups' in el)) as SimpleScenario[];
    expect(ruleScenarios[0]?.location).toBeDefined();
    expect(ruleScenarios[0]?.location?.line).toBeGreaterThan(0);
  });

  it('should handle features without comments gracefully', () => {
    const simpleGherkin = `
Feature: No Comments
  Scenario: Simple scenario
    Given a simple step
    When something happens
    Then it works
`;

    const result = parseGherkin(simpleGherkin);
    
    // Should still have location data
    expect(result.location).toBeDefined();
    expect(result.location?.line).toBeGreaterThan(0);
    
    // Comments array should exist but be empty
    expect(result.comments).toBeDefined();
    expect(result.comments).toHaveLength(0);
    
    // Other elements should still have location data
    const scenario = result.elements?.find(el => 'steps' in el && !('exampleGroups' in el) && !('elements' in el)) as SimpleScenario;
    expect(scenario?.location).toBeDefined();
    expect(scenario?.steps[0]?.location).toBeDefined();
  });

  it('should preserve comments through round-trip conversion', () => {
    const gherkinWithComments = `
# Feature level comment
Feature: Round-trip preservation
  # Scenario comment
  Scenario: Test scenario
    # Step comment
    Given a step
    When something happens
    Then it works
`;

    // Parse to simple format
    const simple = parseGherkin(gherkinWithComments);
    
    // Convert to AST
    const ast = simpleToAst(simple);
    
    // Convert back to simple format
    const roundTrip = astToSimple(ast);
    
    // Verify comments are preserved
    expect(roundTrip.comments).toBeDefined();
    expect(roundTrip.comments.length).toBeGreaterThan(0);
    
    const originalCommentTexts = simple.comments?.map(c => c.text) || [];
    const roundTripCommentTexts = roundTrip.comments?.map(c => c.text) || [];
    
    // Comments should match
    expect(roundTripCommentTexts).toEqual(originalCommentTexts);
    
    // Location data should be preserved
    expect(roundTrip.location).toBeDefined();
    const roundTripScenario = roundTrip.elements?.find(el => 'steps' in el && !('exampleGroups' in el) && !('elements' in el)) as SimpleScenario;
    expect(roundTripScenario?.location).toBeDefined();
    expect(roundTripScenario?.steps[0]?.location).toBeDefined();
  });
});
