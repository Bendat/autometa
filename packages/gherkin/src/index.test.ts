import { describe, it, expect, beforeEach } from 'vitest';
import { 
  parseGherkin, 
  astToSimple, 
  simpleToAst, 
  simpleToGherkin,
  createQueryEngine,
  QueryEngine,
  SimpleScenario,
  SimpleScenarioOutline,
  SimpleRule
} from '../src/index';
import { dialects } from '@cucumber/gherkin';

describe('Gherkin Parser', () => {
  const sampleGherkin = `Feature: Calculator
  As a user
  I want to perform calculations
  So that I can be more efficient

  Scenario: Adding two numbers
    Given I have a calculator
    When I add 5 and 3
    Then the result should be 8

  Scenario Outline: Multiple calculations
    Given I have a calculator
    When I add <num1> and <num2>
    Then the result should be <result>

    Examples:
      | num1 | num2 | result |
      | 1    | 2    | 3      |
      | 5    | 5    | 10     |
`;

  describe('Gherkin Parser', () => {
    it('should parse gherkin to simple format', () => {
      const result = parseGherkin(sampleGherkin);

      expect(result.name).toBe('Calculator');
      expect(result.elements).toHaveLength(2);
      
      // Find the scenario and scenario outline from elements
      const scenario = result.elements?.find(el => 'steps' in el && !('exampleGroups' in el) && !('elements' in el)) as SimpleScenario;
      const scenarioOutline = result.elements?.find(el => 'exampleGroups' in el) as SimpleScenarioOutline;
      
      expect(scenario?.name).toBe('Adding two numbers');
      expect(scenario?.steps).toHaveLength(3);
      expect(scenarioOutline?.name).toBe('Multiple calculations');
    });

    it('should convert simple format back to gherkin', () => {
      const simple = parseGherkin(sampleGherkin);
      const gherkinString = simpleToGherkin(simple);

      expect(gherkinString).toContain('Feature: Calculator');
      expect(gherkinString).toContain('Scenario: Adding two numbers');
      expect(gherkinString).toContain('Given I have a calculator');
    });

    it('should handle round-trip conversion (gherkin -> simple -> ast -> simple)', () => {
      const originalSimple = parseGherkin(sampleGherkin);
      const ast = simpleToAst(originalSimple);
      const roundTripSimple = astToSimple(ast);

      expect(roundTripSimple.name).toBe(originalSimple.name);
      expect(roundTripSimple.elements).toHaveLength(originalSimple.elements?.length || 0);
      
      // Check that we have the same types of elements
      const originalScenarios = originalSimple.elements?.filter(el => 'steps' in el && !('exampleGroups' in el) && !('elements' in el)) || [];
      const originalOutlines = originalSimple.elements?.filter(el => 'exampleGroups' in el) || [];
      const roundTripScenarios = roundTripSimple.elements?.filter(el => 'steps' in el && !('exampleGroups' in el) && !('elements' in el)) || [];
      const roundTripOutlines = roundTripSimple.elements?.filter(el => 'exampleGroups' in el) || [];
      
      expect(roundTripScenarios).toHaveLength(originalScenarios.length);
      expect(roundTripOutlines).toHaveLength(originalOutlines.length);
    });

    it('should allow modification of simple format', () => {
      const simple = parseGherkin(sampleGherkin);
      simple.name = 'Modified Calculator';
      
      const gherkinString = simpleToGherkin(simple);
      expect(gherkinString).toContain('Feature: Modified Calculator');
    });

    it('should handle data tables', () => {
      const gherkinWithTable = `Feature: Data Tables
      Scenario: Using a data table
        Given the following users:
          | name | age |
          | John | 25  |
          | Jane | 30  |
        When I process the data
        Then it should work
      `;

      const simple = parseGherkin(gherkinWithTable);
      const scenario = simple.elements?.find(el => 'steps' in el && !('exampleGroups' in el) && !('elements' in el)) as SimpleScenario;
      const step = scenario?.steps[0];
      
      expect(step).toBeDefined();
      expect(step?.dataTable).toBeDefined();
      expect(step?.dataTable).toHaveLength(3); // Header + 2 data rows
    });

    it('should handle doc strings', () => {
      const gherkinWithDocString = `Feature: Doc Strings
      Scenario: Using a doc string
        Given I have the following JSON:
          """
          {
            "name": "test",
            "value": 42
          }
          """
        When I parse it
        Then it should work
      `;

      const simple = parseGherkin(gherkinWithDocString);
      const scenario = simple.elements?.find(el => 'steps' in el && !('exampleGroups' in el) && !('elements' in el)) as SimpleScenario;
      const step = scenario?.steps[0];
      
      expect(step?.docString).toBeDefined();
      expect(step?.docString?.content).toContain('"name": "test"');
    });
  });

  describe('Query Functions', () => {
    let simple: ReturnType<typeof parseGherkin>;
    let queryEngine: QueryEngine;

    beforeEach(() => {
      simple = parseGherkin(sampleGherkin);
      queryEngine = createQueryEngine(simple);
    });

    it('should find scenarios by ID', () => {
      const scenario = simple.elements?.find(el => 'steps' in el && !('exampleGroups' in el) && !('elements' in el)) as SimpleScenario;
      const scenarioId = scenario?.id;
      
      if (scenarioId) {
        const result = queryEngine.findById(scenarioId);
        expect(result).toBeDefined();
        expect(result?.scenario?.name).toBe('Adding two numbers');
      }
    });

    it('should find examples by ID', () => {
      const scenarioOutline = simple.elements?.find(el => 'exampleGroups' in el) as SimpleScenarioOutline;
      const examplesId = scenarioOutline?.exampleGroups?.[0]?.id;
      
      if (examplesId) {
        const result = queryEngine.findById(examplesId);
        expect(result).toBeDefined();
        expect(result?.exampleGroup?.tableBody).toHaveLength(2);
      }
    });

    it('should find scenarios by keyword and name', () => {
      const results = queryEngine.findByKeywordAndName('Scenario', 'Adding');
      expect(results).toHaveLength(1);
      expect(results[0]?.scenario?.name).toBe('Adding two numbers');
    });

    it('should find scenarios by keyword and name with exact match', () => {
      const results = queryEngine.findByKeywordAndName('Scenario', 'Adding two numbers', { exactMatch: true });
      expect(results).toHaveLength(1);
      
      const noResults = queryEngine.findByKeywordAndName('Scenario', 'Adding', { exactMatch: true });
      expect(noResults).toHaveLength(0);
    });

    it('should find all scenarios by keyword', () => {
      const results = queryEngine.findByKeywordAndName('Scenario', '');
      expect(results).toHaveLength(1); // Just the scenario, not the scenario outline
      
      const regularScenario = results.find(r => r.scenario?.name === 'Adding two numbers');
      expect(regularScenario).toBeDefined();
      
      // If we want to find scenario outlines, we should search for their actual keyword
      const outlineResults = queryEngine.findByKeywordAndName('Scenario Outline', '');
      expect(outlineResults).toHaveLength(1);
      const scenarioOutline = outlineResults.find(r => r.scenarioOutline?.name === 'Multiple calculations');
      expect(scenarioOutline).toBeDefined();
    });

    it('should find by name only', () => {
      const results = queryEngine.findByName('Calculator');
      expect(results).toHaveLength(1); // Feature name
      expect(results[0]?.feature?.name).toBe('Calculator');
    });

    it('should be case insensitive by default', () => {
      const results = queryEngine.findByKeywordAndName('scenario', 'adding');
      expect(results).toHaveLength(1);
      expect(results[0]?.scenario?.name).toBe('Adding two numbers');
    });

    it('should support case sensitive search', () => {
      const results = queryEngine.findByKeywordAndName('scenario', 'adding', { caseSensitive: true });
      expect(results).toHaveLength(0); // Should not match due to case sensitivity
      
      const correctResults = queryEngine.findByKeywordAndName('Scenario', 'Adding', { caseSensitive: true });
      expect(correctResults).toHaveLength(1);
    });

    it('should return null for non-existent ID', () => {
      const result = queryEngine.findById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('Enhanced Query System with Rules, Tags, and Steps', () => {
    let feature: ReturnType<typeof parseGherkin>;
    let queryEngine: QueryEngine;

    beforeEach(() => {
      const complexGherkin = `
@web @regression
Feature: Complex Shopping Cart
  As an online shopper
  I want to manage my shopping cart
  So that I can purchase items

  Background:
    Given I am on the shopping website
    And I am logged in

  @critical @checkout
  Scenario: Add item to cart
    When I click "Add to Cart" for a product
    Then the item should be added to my cart

  @payment @critical
  Scenario Outline: Payment processing
    Given I have <item_count> items in my cart
    When I proceed to checkout with <payment_method>
    Then the payment should be <result>

    Examples:
      | item_count | payment_method | result     |
      | 1          | credit_card    | successful |
      | 2          | paypal         | successful |

  Rule: User Authentication
    Background:
      Given the authentication service is available

    @login @critical
    Scenario: Successful login
      Given I have valid credentials  
      When I attempt to log in
      Then I should be authenticated

    @logout
    Scenario: Logout
      Given I am logged in
      When I click logout
      Then I should be logged out

    Rule: Nested Rule Example
      @nested
      Scenario: Nested scenario
        Given I am in a nested rule
        When something happens
        Then it works
`;

      feature = parseGherkin(complexGherkin);
      queryEngine = createQueryEngine(feature);
    });

    describe('Rules Support', () => {
      it('should parse rules correctly', () => {
        const rules = feature.elements?.filter(el => 'elements' in el && Array.isArray(el.elements)) as SimpleRule[];
        expect(rules).toHaveLength(2);
        expect(rules[0]?.name).toBe('User Authentication');
        
        const rule1Scenarios = rules[0]?.elements?.filter(el => 'steps' in el && !('exampleGroups' in el)) || [];
        expect(rule1Scenarios).toHaveLength(2);
        expect(rules[1]?.name).toBe('Nested Rule Example');
      });

      it('should find rules by ID', () => {
        const rules = feature.elements?.filter(el => 'elements' in el && Array.isArray(el.elements)) as SimpleRule[];
        const ruleId = rules[0]?.id;
        
        if (ruleId) {
          const result = queryEngine.findById(ruleId);
          expect(result).toBeDefined();
          expect(result?.rule?.name).toBe('User Authentication');
        }
      });

      it('should find scenarios within rules', () => {
        const rules = feature.elements?.filter(el => 'elements' in el && Array.isArray(el.elements)) as SimpleRule[];
        const rule1Scenarios = rules[0]?.elements?.filter(el => 'steps' in el && !('exampleGroups' in el)) as SimpleScenario[];
        const scenarioId = rule1Scenarios[0]?.id;
        
        if (scenarioId) {
          const result = queryEngine.findById(scenarioId);
          expect(result).toBeDefined();
          expect(result?.scenario?.name).toBe('Successful login');
          expect(result?.rule?.name).toBe('User Authentication');
        }
      });

      it('should handle rule backgrounds', () => {
        const rules = feature.elements?.filter(el => 'elements' in el && Array.isArray(el.elements)) as SimpleRule[];
        const rule = rules[0];
        expect(rule?.background).toBeDefined();
        expect(rule?.background?.steps).toHaveLength(1);
        expect(rule?.background?.steps[0]?.text).toBe('the authentication service is available');
      });
    });

    describe('Tag-based Querying', () => {
      it('should find elements by single tag', () => {
        const results = queryEngine.findByTags(['@critical']);
        expect(results.length).toBeGreaterThan(0);
        
        const criticalScenarios = results.filter(r => r.scenario);
        expect(criticalScenarios.some(r => r.scenario?.name === 'Successful login')).toBe(true);
      });

      it('should find elements by multiple tags (match any)', () => {
        const results = queryEngine.findByTags(['@login', '@payment'], { matchMode: 'any' });
        expect(results.length).toBeGreaterThan(0);
        
        const hasLoginScenario = results.some(r => r.scenario?.name === 'Successful login');
        const hasPaymentScenario = results.some(r => r.scenarioOutline?.name === 'Payment processing');
        expect(hasLoginScenario || hasPaymentScenario).toBe(true);
      });

      it('should find elements by multiple tags (match all)', () => {
        const results = queryEngine.findByTags(['@checkout', '@critical'], { matchMode: 'all' });
        expect(results.length).toBeGreaterThan(0);
        
        const matchingScenario = results.find(r => r.scenario?.name === 'Add item to cart');
        expect(matchingScenario).toBeDefined();
      });

      it('should support case-insensitive tag matching', () => {
        const results = queryEngine.findByTags(['@CRITICAL'], { caseSensitive: false });
        expect(results.length).toBeGreaterThan(0);
      });

      it('should support case-sensitive tag matching', () => {
        const results = queryEngine.findByTags(['@CRITICAL'], { caseSensitive: true });
        expect(results).toHaveLength(0); // Should not match lowercase @critical
      });
    });

    describe('Step-level Querying', () => {
      it('should find steps by keyword', () => {
        const results = queryEngine.findSteps({ keyword: 'Given' });
        expect(results.length).toBeGreaterThan(0);
        
        const backgroundStep = results.find(r => r.step?.text === 'I am on the shopping website');
        expect(backgroundStep).toBeDefined();
      });

      it('should find steps by text content', () => {
        const results = queryEngine.findSteps({ text: 'Add to Cart' });
        expect(results.length).toBeGreaterThan(0);
        
        const addToCartStep = results.find(r => r.step?.text.includes('Add to Cart'));
        expect(addToCartStep).toBeDefined();
      });

      it('should find steps by both keyword and text', () => {
        const results = queryEngine.findSteps({ 
          keyword: 'When', 
          text: 'click' 
        });
        expect(results.length).toBeGreaterThan(0);
        
        const clickStep = results.find(r => r.step?.text.includes('click'));
        expect(clickStep).toBeDefined();
      });

      it('should find steps across rules and scenarios', () => {
        const results = queryEngine.findSteps({ keyword: 'Then' });
        
        // Should find steps in feature background, rule backgrounds, and scenarios
        expect(results.length).toBeGreaterThan(0);
      });
    });

    describe('QueryEngine Class', () => {
      it('should provide all query methods', () => {
        expect(typeof queryEngine.findById).toBe('function');
        expect(typeof queryEngine.findByKeywordAndName).toBe('function');
        expect(typeof queryEngine.findByName).toBe('function');
        expect(typeof queryEngine.findByTags).toBe('function');
        expect(typeof queryEngine.findSteps).toBe('function');
      });

      it('should get all rules', () => {
        const rules = queryEngine.getAllRules();
        expect(rules).toHaveLength(2);
        expect(rules.map(r => r.name)).toContain('User Authentication');
      });

      it('should get all scenarios including those in rules', () => {
        const scenarios = queryEngine.getAllScenarios();
        expect(scenarios.length).toBeGreaterThan(3); // Feature scenarios + rule scenarios
        
        const loginScenario = scenarios.find(s => s.name === 'Successful login');
        expect(loginScenario).toBeDefined();
      });

      it('should use QueryEngine directly', () => {
        const scenario = feature.elements?.find(el => 'steps' in el && !('exampleGroups' in el) && !('elements' in el)) as SimpleScenario;
        const engineResult = queryEngine.findById(scenario?.id || '');
        expect(engineResult).toBeDefined();
        expect(engineResult?.scenario?.name).toBe('Add item to cart');
      });
    });

    describe('Complex Query Scenarios', () => {
      it('should find scenarios by tag within specific rules', () => {
        const criticalResults = queryEngine.findByTags(['@critical']);
        const ruleScenarios = criticalResults.filter(r => r.rule && r.scenario);
        
        expect(ruleScenarios.length).toBeGreaterThan(0);
        expect(ruleScenarios.some(r => r.scenario?.name === 'Successful login')).toBe(true);
      });

      it('should handle complex path navigation', () => {
        const rules = feature.elements?.filter(el => 'elements' in el && Array.isArray(el.elements)) as SimpleRule[];
        const rule1Scenarios = rules[0]?.elements?.filter(el => 'steps' in el && !('exampleGroups' in el)) as SimpleScenario[];
        const ruleScenarioStep = rule1Scenarios[0]?.steps[0];
        if (ruleScenarioStep?.id) {
          const result = queryEngine.findById(ruleScenarioStep.id);
          expect(result?.path).toContain('elements[');
          expect(result?.step?.text).toBe('I have valid credentials');
        }
      });
    });
  });

  describe('Localized Keywords Support', () => {
    it('should correctly parse French gherkin with localized keywords', () => {
      const frenchGherkin = `# language: fr
@fonctionnalité-tag
Fonctionnalité: Calculatrice française
  En tant qu'utilisateur
  Je veux effectuer des calculs
  Afin d'être plus efficace

  Contexte:
    Soit une calculatrice disponible

  @scénario-tag  
  Scénario: Addition de deux nombres
    Soit j'ai une calculatrice
    Quand j'additionne 5 et 3
    Alors le résultat devrait être 8

  @plan-tag
  Plan du scénario: Calculs multiples
    Soit j'ai une calculatrice
    Quand j'additionne <num1> et <num2>
    Alors le résultat devrait être <resultat>

    Exemples:
      | num1 | num2 | resultat |
      | 1    | 2    | 3        |
      | 5    | 5    | 10       |
`;

      const simple = parseGherkin(frenchGherkin);
      
      expect(simple.name).toBe('Calculatrice française');
      expect(simple.language).toBe('fr');
      expect(simple.keyword).toBe('Fonctionnalité');
      expect(simple.background?.keyword).toBe('Contexte');
      const scenario = simple.elements?.find(el => 'steps' in el && !('exampleGroups' in el) && !('elements' in el)) as SimpleScenario;
      const scenarioOutline = simple.elements?.find(el => 'steps' in el && 'exampleGroups' in el) as SimpleScenarioOutline;
      expect(scenario?.keyword).toBe('Scénario');
      expect(scenarioOutline?.keyword).toBe('Plan du scénario');
    });

    it('should correctly parse German gherkin with localized keywords', () => {
      const germanGherkin = `# language: de
Funktionalität: Deutsche Rechner
  Als Benutzer
  Möchte ich Berechnungen durchführen
  Um effizienter zu sein

  Szenario: Zwei Zahlen addieren
    Angenommen ich habe einen Rechner
    Wenn ich 5 und 3 addiere
    Dann sollte das Ergebnis 8 sein
`;

      const simple = parseGherkin(germanGherkin);
      
      expect(simple.name).toBe('Deutsche Rechner');
      expect(simple.language).toBe('de');
      expect(simple.keyword).toBe('Funktionalität');
      const scenario = simple.elements?.find(el => 'steps' in el && !('exampleGroups' in el) && !('elements' in el)) as SimpleScenario;
      expect(scenario?.keyword).toBe('Szenario');
    });

    it('should support searching by localized keywords', () => {
      const frenchGherkin = `# language: fr
Fonctionnalité: Test français
  Scénario: Test scénario
    Soit une condition
    Quand quelque chose arrive
    Alors ça marche
`;
      
      const simple = parseGherkin(frenchGherkin);
      const queryEngine = createQueryEngine(simple);
      
      // Should find by French keywords
      const scenarios = queryEngine.findByKeywordAndName('Scénario', '');
      expect(scenarios.length).toBeGreaterThanOrEqual(1);
      const scenarioResult = scenarios.find(r => r.scenario && !r.scenarioOutline);
      expect(scenarioResult?.scenario?.keyword).toBe('Scénario');
    });

    it('should round-trip preserve localized keywords', () => {
      const frenchGherkin = `# language: fr
Fonctionnalité: Préservation française
  Scénario: Test de préservation
    Soit une condition
    Quand quelque chose arrive
    Alors ça marche
`;

      const simple = parseGherkin(frenchGherkin);
      const roundTripGherkin = simpleToGherkin(simple);
      
      expect(roundTripGherkin).toContain('# language: fr');
      expect(roundTripGherkin).toContain('Fonctionnalité: Préservation française');
      expect(roundTripGherkin).toContain('Scénario: Test de préservation');
    });

    it('should validate that different languages have different keyword mappings', () => {
      expect(dialects.fr?.feature).toContain('Fonctionnalité');
      expect(dialects.de?.feature).toContain('Funktionalität');
      expect(dialects.es?.feature).toContain('Característica');
      
      // These should be different from English
      expect(dialects.fr?.feature).not.toContain('Feature');
      expect(dialects.de?.scenario).not.toContain('Scenario');
    });

    it('should handle keyword type mapping consistently', () => {
      const dialects_fr = dialects.fr;
      expect(dialects_fr?.given).toBeDefined();
      expect(dialects_fr?.when).toBeDefined();
      expect(dialects_fr?.then).toBeDefined();
      expect(dialects_fr?.and).toBeDefined();
      expect(dialects_fr?.but).toBeDefined();
    });

    it('should access cucumber dialect information', () => {
      expect(dialects.en).toBeDefined();
      expect(dialects.fr).toBeDefined();
      expect(dialects.de).toBeDefined();
      expect(dialects.es).toBeDefined();
      
      expect(dialects.en?.feature).toContain('Feature');
      expect(dialects.en?.scenario).toContain('Scenario');
    });
  });

  describe('Language Override', () => {
    it('should use default language when not specified in Gherkin', () => {
      const gherkinWithoutLanguage = `
        Feature: Calculator
          Scenario: Addition
            Given I have 2 and 3
            When I add them
            Then I should get 5
      `;
      
      // Parse without language override (defaults to English)
      const feature1 = parseGherkin(gherkinWithoutLanguage);
      expect(feature1.language).toBe('en');
      
      // For non-English languages, we need to use the correct keywords
      const frenchGherkin = `
        Fonctionnalité: Calculatrice
          Scénario: Addition
            Soit j'ai 2 et 3
            Quand je les additionne
            Alors je dois obtenir 5
      `;
      
      // Parse with French as default language
      const feature2 = parseGherkin(frenchGherkin, { defaultLanguage: 'fr' });
      expect(feature2.language).toBe('fr');
    });

    it('should prioritize language specified in Gherkin over default', () => {
      const frenchGherkin = `
        # language: fr
        Fonctionnalité: Calculatrice
          Scénario: Addition
            Soit j'ai 2 et 3
            Quand je les additionne
            Alors je dois obtenir 5
      `;
      
      // Even with English as default, should use French from the file
      const feature = parseGherkin(frenchGherkin, { defaultLanguage: 'en' });
      expect(feature.language).toBe('fr');
      expect(feature.keyword).toBe('Fonctionnalité');
      
      const scenario = feature.elements?.find(el => 'steps' in el && !('exampleGroups' in el) && !('elements' in el)) as SimpleScenario;
      expect(scenario?.keyword).toBe('Scénario');
    });

    it('should handle German default language', () => {
      const germanGherkin = `
        Funktionalität: Rechner
          Szenario: Addition
            Angenommen ich habe Zahlen
            Wenn ich rechne
            Dann erhalte ich ein Ergebnis
      `;
      
      const feature = parseGherkin(germanGherkin, { defaultLanguage: 'de' });
      expect(feature.language).toBe('de');
      expect(feature.keyword).toBe('Funktionalität');
    });
  });
});
