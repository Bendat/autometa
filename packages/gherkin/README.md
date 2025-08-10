# @autometa/gherkin

A powerful TypeScript library for parsing, querying, and manipulating Gherkin feature files. This package provides a modern, type-safe API for working with Cucumber features, scenarios, and steps.

## ✨ Features

- 🚀 **Fast & Lightweight** - Optimized parser with minimal dependencies
- 📝 **Type-Safe** - Full TypeScript support with comprehensive type definitions
- 🔍 **Powerful Querying** - Advanced search and filtering capabilities
- 🌐 **Internationalization** - Support for all Gherkin languages
- 🔄 **Unified API** - Single elements array preserving document order
- 🧪 **Pickle Generation** - Create executable test scenarios
- 📍 **Location Tracking** - Precise line/column information for debugging

## 🚀 Installation

```bash
npm install @autometa/gherkin
```

## 📖 Quick Start

```typescript
import { parseGherkin, createQueryEngine, generatePickles } from '@autometa/gherkin';

// Parse a Gherkin feature file
const gherkin = `
Feature: Calculator
  As a user
  I want to perform calculations
  So that I can solve math problems

  Scenario: Adding two numbers
    Given I have a calculator
    When I add 2 and 3
    Then the result should be 5
`;

const feature = parseGherkin(gherkin);

// Access elements in document order
feature.elements?.forEach(element => {
  if ('steps' in element && !('exampleGroups' in element) && !('elements' in element)) {
    console.log(`Scenario: ${element.name}`);
  } else if ('steps' in element && 'exampleGroups' in element) {
    console.log(`Scenario Outline: ${element.name}`);
  } else if ('elements' in element) {
    console.log(`Rule: ${element.name}`);
  }
});

// Generate executable pickles
const pickles = generatePickles(feature);
console.log(`Generated ${pickles.length} executable scenarios`);
```

## 🏗️ Core API

### Parsing

```typescript
import { parseGherkin, astToSimple } from '@autometa/gherkin';

// Parse Gherkin text directly
const feature = parseGherkin(gherkinText);

// Convert from Gherkin AST
const gherkinDocument = /* from @cucumber/gherkin */;
const feature = astToSimple(gherkinDocument);
```

### Type Structure

The new unified API uses a single `elements` array that preserves document order:

```typescript
interface SimpleFeature {
  id: string;
  name: string;
  description?: string;
  keyword: string;
  language: string;
  tags: string[];
  background?: SimpleBackground;
  elements: SimpleFeatureElement[]; // 🆕 Unified array
  comments?: SimpleComment[];
  location?: SimpleLocation;
  uri?: string;
}

// Elements can be scenarios, scenario outlines, or rules
type SimpleFeatureElement = SimpleScenario | SimpleScenarioOutline | SimpleRule;
```

### Type Guards

Use type guards to identify element types:

```typescript
function isScenario(element: SimpleFeatureElement): element is SimpleScenario {
  return 'steps' in element && !('exampleGroups' in element) && !('elements' in element);
}

function isScenarioOutline(element: SimpleFeatureElement): element is SimpleScenarioOutline {
  return 'steps' in element && 'exampleGroups' in element;
}

function isRule(element: SimpleFeatureElement): element is SimpleRule {
  return 'elements' in element && Array.isArray(element.elements);
}

// Usage
feature.elements?.forEach(element => {
  if (isScenario(element)) {
    console.log(`Scenario: ${element.name} with ${element.steps.length} steps`);
  } else if (isScenarioOutline(element)) {
    console.log(`Outline: ${element.name} with ${element.exampleGroups.length} example groups`);
  } else if (isRule(element)) {
    console.log(`Rule: ${element.name} with ${element.elements.length} sub-elements`);
  }
});
```

## 🔍 Querying

### Language Support

The library supports internationalization with automatic language detection from Gherkin files. You can also override the default language:

```typescript
import { parseGherkin } from '@autometa/gherkin';

// Parse English Gherkin (default)
const englishFeature = parseGherkin(`
  Feature: Calculator
    Scenario: Addition
      Given I have numbers
      When I add them
      Then I get result
`);

// Parse French Gherkin with explicit language declaration
const frenchFeature = parseGherkin(`
  # language: fr
  Fonctionnalité: Calculatrice
    Scénario: Addition
      Soit j'ai des nombres
      Quand je les additionne
      Alors j'obtiens le résultat
`);

// Parse German Gherkin with language override
const germanFeature = parseGherkin(`
  Funktionalität: Rechner
    Szenario: Addition
      Angenommen ich habe Zahlen
      Wenn ich sie addiere
      Dann erhalte ich das Ergebnis
`, { defaultLanguage: 'de' });

console.log(englishFeature.language); // 'en'
console.log(frenchFeature.language);  // 'fr' (from file declaration)
console.log(germanFeature.language);  // 'de' (from override)
```

**Language Precedence:**
1. Language declared in Gherkin file (`# language: fr`) takes highest precedence
2. `defaultLanguage` option takes second precedence
3. Falls back to English (`'en'`) if neither is specified

### Query Engine

```typescript
import { createQueryEngine } from '@autometa/gherkin';

const queryEngine = createQueryEngine(feature);

// Find by ID
const element = queryEngine.findById('scenario-id-123');

// Find by tags
const criticalScenarios = queryEngine.findByTags(['@critical']);

// Find by keyword and name
const loginScenarios = queryEngine.findByKeywordAndName('Scenario', 'login');

// Get all elements in a flat structure
const allElements = queryEngine.getAllElements();
```

### Helper Functions

```typescript
// Find scenarios by name
const scenarios = feature.elements?.filter(isScenario)
  .filter(scenario => scenario.name.includes('login'));

// Find all steps across all scenarios
const allSteps = feature.elements
  ?.filter(isScenario)
  .flatMap(scenario => scenario.steps) || [];

// Find rules containing specific scenarios
const rulesWithPayment = feature.elements?.filter(isRule)
  .filter(rule => 
    rule.elements.some(el => 
      isScenario(el) && el.name.includes('payment')
    )
  );
```

## 🧪 Pickle Generation

Pickles are executable test scenarios with all background steps included:

```typescript
import { generatePickles, generatePickleById } from '@autometa/gherkin';

// Generate all pickles
const pickles = generatePickles(feature);

// Generate specific pickle by scenario ID
const scenarioId = feature.elements?.[0]?.id;
if (scenarioId) {
  const pickle = generatePickleById(feature, scenarioId);
}

// Access pickle information
pickles.forEach(pickle => {
  console.log(`Pickle: ${pickle.name}`);
  console.log(`Steps: ${pickle.steps.length}`);
  console.log(`Tags: ${pickle.tags.join(', ')}`);
  
  pickle.steps.forEach(step => {
    console.log(`  ${step.keyword}${step.text}`);
    if (step.dataTable) {
      console.log('    Has data table');
    }
    if (step.docString) {
      console.log('    Has doc string');
    }
  });
});
```

## 🔄 Conversion

```typescript
import { simpleToAst, simpleToGherkin } from '@autometa/gherkin';

// Convert back to Gherkin AST
const gherkinDocument = simpleToAst(feature);

// Convert back to Gherkin text
const gherkinText = simpleToGherkin(feature);
```

## 🌐 Internationalization

The library supports all Gherkin languages:

```typescript
const frenchGherkin = `
# language: fr
Fonctionnalité: Calculatrice
  Scénario: Addition
    Soit une calculatrice
    Quand j'additionne 2 et 3
    Alors le résultat devrait être 5
`;

const feature = parseGherkin(frenchGherkin);
console.log(`Language: ${feature.language}`); // "fr"
```

## 📍 Location Information

Every element includes precise location information:

```typescript
const scenario = feature.elements?.find(isScenario);
if (scenario?.location) {
  console.log(`Scenario at line ${scenario.location.line}, column ${scenario.location.column}`);
}

scenario?.steps.forEach((step, index) => {
  if (step.location) {
    console.log(`Step ${index + 1} at line ${step.location.line}`);
  }
});
```

## 🔧 Advanced Usage

### Working with Rules

```typescript
// Find all scenarios within rules
const ruleScenariosFlat = feature.elements
  ?.filter(isRule)
  .flatMap(rule => rule.elements.filter(isScenario)) || [];

// Process rule hierarchy
feature.elements?.forEach(element => {
  if (isRule(element)) {
    console.log(`Rule: ${element.name}`);
    
    if (element.background) {
      console.log(`  Background: ${element.background.steps.length} steps`);
    }
    
    element.elements.forEach(subElement => {
      if (isScenario(subElement)) {
        console.log(`  Scenario: ${subElement.name}`);
      } else if (isScenarioOutline(subElement)) {
        console.log(`  Scenario Outline: ${subElement.name}`);
      }
    });
  }
});
```

### Error Handling

```typescript
try {
  const feature = parseGherkin(gherkinText);
  // Process feature...
} catch (error) {
  if (error.message.includes('Parser error')) {
    console.error('Invalid Gherkin syntax:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## 📚 API Reference

### Main Functions

- `parseGherkin(gherkinText: string): SimpleFeature` - Parse Gherkin text
- `astToSimple(gherkinDocument): SimpleFeature` - Convert from AST
- `simpleToAst(feature): GherkinDocument` - Convert to AST
- `simpleToGherkin(feature): string` - Convert to Gherkin text
- `generatePickles(feature): SimplePickle[]` - Generate all pickles
- `generatePickleById(feature, id): SimplePickle | null` - Generate specific pickle
- `createQueryEngine(feature): QueryEngine` - Create query engine

### Type Guards

- `isScenario(element): element is SimpleScenario`
- `isScenarioOutline(element): element is SimpleScenarioOutline` 
- `isRule(element): element is SimpleRule`

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and ensure all tests pass:

```bash
npm test
npm run build
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Related Packages

- `@autometa/cucumber-runner` - Full Cucumber test runner
- `@autometa/jest-transformer` - Jest transformer for feature files
- `@autometa/test-builder` - Test building utilities
