import { describe, it, expect } from 'vitest';
import { parseGherkin } from './parsers';
import { PickleGenerator, generatePickles, generatePickleById } from './pickle-generator';
import { SimpleScenario } from './types';

describe('Pickle Generator', () => {
  const sampleGherkin = `
@feature-tag
Feature: Pickle Generation Test
  As a developer
  I want to generate pickles with line numbers
  So that I can provide execution context

  Background:
    Given a background step

  @scenario-tag
  Scenario: Basic pickle generation
    When I generate a pickle
    Then it should contain line numbers
    And it should have execution context

  @outline-tag
  Scenario Outline: Outline pickle generation
    When I use <parameter>
    Then I get <result>

    Examples:
      | parameter | result  |
      | value1    | result1 |
      | value2    | result2 |

  Rule: Pickles in rules work too
    @rule-scenario-tag
    Scenario: Scenario in rule
      Given a scenario in a rule
      When it's converted to a pickle
      Then it preserves rule context
`;

  describe('PickleGenerator class', () => {
    it('should generate pickles for all scenarios', () => {
      const feature = parseGherkin(sampleGherkin);
      const generator = new PickleGenerator(feature);
      const pickles = generator.generatePickles();

      expect(pickles.length).toBeGreaterThan(0);
      
      // Should have pickles for: basic scenario + 2 outline scenarios + 1 rule scenario = 4 total
      expect(pickles.length).toBe(4);

      // Each pickle should have required properties
      pickles.forEach(pickle => {
        expect(pickle.id).toBeDefined();
        expect(pickle.name).toBeDefined();
        expect(pickle.language).toBe('en');
        expect(pickle.steps).toBeDefined();
        expect(pickle.tags).toBeDefined();
        expect(pickle.feature).toBeDefined();
        expect(pickle.scenario).toBeDefined();
      });
    });

    it('should include background steps in all pickles', () => {
      const feature = parseGherkin(sampleGherkin);
      const generator = new PickleGenerator(feature);
      const pickles = generator.generatePickles();

      pickles.forEach(pickle => {
        expect(pickle.steps.length).toBeGreaterThan(0);
        expect(pickle.steps[0]?.text).toBe('a background step');
        expect(pickle.steps[0]?.keyword).toBe('Given ');
      });
    });

    it('should preserve location information in pickle steps', () => {
      const feature = parseGherkin(sampleGherkin);
      const generator = new PickleGenerator(feature);
      const pickles = generator.generatePickles();

      const firstPickle = pickles[0];
      expect(firstPickle).toBeDefined();
      
      if (firstPickle) {
        firstPickle.steps.forEach(step => {
          expect(step.location).toBeDefined();
          expect(step.location.line).toBeGreaterThan(0);
        });
      }
    });

    it('should combine tags from feature, rule, and scenario', () => {
      const feature = parseGherkin(sampleGherkin);
      const generator = new PickleGenerator(feature);
      const pickles = generator.generatePickles();

      // Find the basic scenario pickle
      const basicPickle = pickles.find(p => p.name === 'Basic pickle generation');
      expect(basicPickle).toBeDefined();
      
      if (basicPickle) {
        expect(basicPickle.tags).toContain('@feature-tag');
        expect(basicPickle.tags).toContain('@scenario-tag');
      }

      // Find the rule scenario pickle
      const rulePickle = pickles.find(p => p.name === 'Scenario in rule');
      expect(rulePickle).toBeDefined();
      
      if (rulePickle) {
        expect(rulePickle.tags).toContain('@feature-tag');
        expect(rulePickle.tags).toContain('@rule-scenario-tag');
        expect(rulePickle.rule).toBeDefined();
        expect(rulePickle.rule?.name).toBe('Pickles in rules work too');
      }
    });

    it('should generate pickle by specific scenario ID', () => {
      const feature = parseGherkin(sampleGherkin);
      const generator = new PickleGenerator(feature);
      
      // Get the first scenario's ID
      const firstScenario = feature.elements?.find(el => 'steps' in el && !('exampleGroups' in el) && !('elements' in el)) as SimpleScenario;
      expect(firstScenario).toBeDefined();
      
      if (firstScenario) {
        const pickle = generator.generatePickleById(firstScenario.id);
        expect(pickle).toBeDefined();
        expect(pickle?.name).toBe(firstScenario.name);
        expect(pickle?.scenario.id).toBe(firstScenario.id);
      }
    });

    it('should categorize step types correctly', () => {
      const feature = parseGherkin(sampleGherkin);
      const generator = new PickleGenerator(feature);
      const pickles = generator.generatePickles();

      const basicPickle = pickles.find(p => p.name === 'Basic pickle generation');
      expect(basicPickle).toBeDefined();
      
      if (basicPickle) {
        // Background step (Given)
        expect(basicPickle.steps[0]?.type).toBe('context');
        expect(basicPickle.steps[0]?.keywordType).toBe('context');
        
        // When step
        const whenStep = basicPickle.steps.find(s => s.keyword.includes('When'));
        expect(whenStep?.type).toBe('action');
        expect(whenStep?.keywordType).toBe('action');
        
        // Then step
        const thenStep = basicPickle.steps.find(s => s.keyword.includes('Then'));
        expect(thenStep?.type).toBe('outcome');
        expect(thenStep?.keywordType).toBe('outcome');
      }
    });
  });

  describe('Convenience functions', () => {
    it('generatePickles should work as a convenience function', () => {
      const feature = parseGherkin(sampleGherkin);
      const pickles = generatePickles(feature);

      expect(pickles.length).toBe(4);
      expect(pickles[0]?.name).toBeDefined();
    });

    it('generatePickleById should work as a convenience function', () => {
      const feature = parseGherkin(sampleGherkin);
      const firstScenario = feature.elements?.find(el => 'steps' in el && !('exampleGroups' in el) && !('elements' in el)) as SimpleScenario;
      
      if (firstScenario) {
        const pickle = generatePickleById(feature, firstScenario.id);
        expect(pickle).toBeDefined();
        expect(pickle?.name).toBe(firstScenario.name);
      }
    });

    it('should return null for non-existent scenario ID', () => {
      const feature = parseGherkin(sampleGherkin);
      const pickle = generatePickleById(feature, 'non-existent-id');
      expect(pickle).toBeNull();
    });
  });

  describe('Feature context preservation', () => {
    it('should preserve feature information in pickles', () => {
      const feature = parseGherkin(sampleGherkin);
      const pickles = generatePickles(feature);

      pickles.forEach(pickle => {
        expect(pickle.feature.name).toBe('Pickle Generation Test');
        expect(pickle.feature.tags).toContain('@feature-tag');
        expect(pickle.feature.location).toBeDefined();
        expect(pickle.feature.location.line).toBeGreaterThan(0);
      });
    });

    it('should preserve scenario information in pickles', () => {
      const feature = parseGherkin(sampleGherkin);
      const pickles = generatePickles(feature);

      const basicPickle = pickles.find(p => p.name === 'Basic pickle generation');
      expect(basicPickle).toBeDefined();
      
      if (basicPickle) {
        expect(basicPickle.scenario.type).toBe('scenario');
        expect(basicPickle.scenario.location).toBeDefined();
        expect(basicPickle.scenario.tags).toContain('@scenario-tag');
      }

      // Check scenario outline type
      const outlinePickles = pickles.filter(p => p.name.includes('value'));
      outlinePickles.forEach(pickle => {
        expect(pickle.scenario.type).toBe('scenario_outline');
      });
    });
  });
});
