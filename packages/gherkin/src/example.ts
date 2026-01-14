/**
 * Example demonstrating the @autometa/gherkin API
 * Run with: npm run dev example.ts
 */

import { parseGherkin, createQueryEngine, generatePickles, SimpleFeatureElement, SimpleScenario, SimpleScenarioOutline, SimpleRule } from './index';

const exampleGherkin = `
Feature: Online Shopping Cart
  As a customer
  I want to manage my shopping cart
  So that I can purchase items

  Background:
    Given I am on the shopping website
    And I am logged in as a customer

  @smoke @cart
  Scenario: Add item to cart
    When I search for "laptop"
    And I click on the first search result
    And I click "Add to Cart"
    Then the item should be added to my cart
    And the cart count should increase by 1

  @cart @checkout
  Scenario Outline: Apply discount codes
    Given I have items worth $<amount> in my cart
    When I apply discount code "<code>"
    Then my cart total should be $<final_amount>

    Examples:
      | amount | code        | final_amount |
      | 100    | SAVE10      | 90           |
      | 50     | FREESHIP    | 50           |
      | 200    | HOLIDAY20   | 160          |

  Rule: Express checkout is available for premium members
    Background:
      Given I am a premium member

    @premium @express
    Scenario: Express checkout
      Given I have items in my cart
      When I click "Express Checkout"
      Then I should be taken directly to payment
      And shipping should be automatically selected

    @premium
    Scenario: Premium member benefits
      When I view my cart
      Then I should see "Free shipping" applied
      And I should see "Priority support" badge
`;

console.log('🚀 @autometa/gherkin Example\n');

// Parse the Gherkin
const feature = parseGherkin(exampleGherkin);

console.log(`📝 Feature: ${feature.name}`);
console.log(`🏷️  Tags: ${feature.tags.join(', ')}`);
console.log(`🌐 Language: ${feature.language}`);
console.log(`📍 Location: line ${feature.location?.line}\n`);

// Show unified elements structure
console.log('📋 Elements (in document order):');
feature.elements?.forEach((element, index) => {
  if ('steps' in element && !('exampleGroups' in element) && !('elements' in element)) {
    // Scenario
    console.log(`  ${index + 1}. 🎭 Scenario: "${element.name}"`);
    console.log(`     📍 Line ${element.location?.line}, ${element.steps.length} steps`);
    console.log(`     🏷️  Tags: ${element.tags.join(', ')}`);
  } else if ('steps' in element && 'exampleGroups' in element) {
    // Scenario Outline
    console.log(`  ${index + 1}. 🔄 Scenario Outline: "${element.name}"`);
    console.log(`     📍 Line ${element.location?.line}, ${element.steps.length} steps`);
    console.log(`     📊 ${element.exampleGroups.length} example groups`);
    console.log(`     🏷️  Tags: ${element.tags.join(', ')}`);
  } else if ('elements' in element) {
    // Rule
    const rule = element as SimpleRule;
    console.log(`  ${index + 1}. 📏 Rule: "${rule.name}"`);
    console.log(`     📍 Line ${rule.location?.line}`);
    console.log(`     📦 ${rule.elements.length} sub-elements`);
    if (rule.background) {
      console.log(`     🎬 Background: ${rule.background.steps.length} steps`);
    }
  }
});

// Query examples
console.log('\n🔍 Query Examples:');
const queryEngine = createQueryEngine(feature);

// Find by tags
const cartScenarios = queryEngine.findByTags(['@cart']);
console.log(`\n🏷️  Scenarios with @cart tag: ${cartScenarios.length}`);
cartScenarios.forEach(result => {
  console.log(`   - ${result.scenario?.name || result.scenarioOutline?.name}`);
});

// Find premium scenarios
const premiumScenarios = queryEngine.findByTags(['@premium']);
console.log(`\n⭐ Premium scenarios: ${premiumScenarios.length}`);
premiumScenarios.forEach(result => {
  console.log(`   - ${result.scenario?.name} (in rule: ${result.rule?.name})`);
});

// Generate pickles
console.log('\n🥒 Generated Pickles:');
const pickles = generatePickles(feature);
console.log(`Total executable scenarios: ${pickles.length}\n`);

pickles.forEach((pickle, index) => {
  console.log(`${index + 1}. 🎯 "${pickle.name}"`);
  console.log(`   📍 Scenario ID: ${pickle.scenario.id}`);
  console.log(`   🏷️  Tags: ${pickle.tags.join(', ')}`);
  console.log(`   📝 Steps: ${pickle.steps.length} (including background)`);
  
  // Show first few steps
  console.log('   📋 First few steps:');
  pickle.steps.slice(0, 3).forEach((step, stepIndex) => {
    console.log(`      ${stepIndex + 1}. ${step.keyword}${step.text}`);
  });
  
  if (pickle.steps.length > 3) {
    console.log(`      ... and ${pickle.steps.length - 3} more steps`);
  }
  
  console.log('');
});

// Show type guard usage
console.log('🔧 Type Guard Examples:');

function isScenario(element: SimpleFeatureElement): element is SimpleScenario {
  return 'steps' in element && !('exampleGroups' in element) && !('elements' in element);
}

function isScenarioOutline(element: SimpleFeatureElement): element is SimpleScenarioOutline {
  return 'steps' in element && 'exampleGroups' in element;
}

function isRule(element: SimpleFeatureElement): element is SimpleRule {
  return 'elements' in element && Array.isArray(element.elements);
}

const scenarios = feature.elements?.filter(isScenario) || [];
const outlines = feature.elements?.filter(isScenarioOutline) || [];
const rules = feature.elements?.filter(isRule) || [];

console.log(`📊 Element breakdown:`);
console.log(`   🎭 Scenarios: ${scenarios.length}`);
console.log(`   🔄 Scenario Outlines: ${outlines.length}`);
console.log(`   📏 Rules: ${rules.length}`);

// 6. Language Override Examples
console.log('\n🌍 Language Override Examples:');

// English Gherkin (default behavior)
const englishGherkin = `
Feature: Calculator
  Scenario: Addition
    Given I have two numbers
    When I add them
    Then I get the sum
`;

const englishFeature = parseGherkin(englishGherkin);
console.log('English (default):', { language: englishFeature.language, keyword: englishFeature.keyword });

// French Gherkin with explicit language declaration
const frenchGherkin = `
# language: fr
Fonctionnalité: Calculatrice
  Scénario: Addition
    Soit j'ai deux nombres
    Quand je les additionne
    Alors j'obtiens la somme
`;

const frenchFeature = parseGherkin(frenchGherkin);
console.log('French (explicit):', { language: frenchFeature.language, keyword: frenchFeature.keyword });

// German Gherkin with default language override
const germanGherkin = `
Funktionalität: Rechner
  Szenario: Addition
    Angenommen ich habe zwei Zahlen
    Wenn ich sie addiere
    Dann erhalte ich die Summe
`;

const germanFeature = parseGherkin(germanGherkin, { defaultLanguage: 'de' });
console.log('German (override):', { language: germanFeature.language, keyword: germanFeature.keyword });

console.log('\n✨ Complete! The new API preserves document order and provides powerful querying capabilities.');
