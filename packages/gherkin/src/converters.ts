/**
 * Gherkin conversion functions - convert from Simple format to AST/Gherkin
 */

import * as messages from '@cucumber/messages';
import { v4 as uuid } from 'uuid';

import { 
  SimpleFeature, 
  SimpleScenario, 
  SimpleScenarioOutline, 
  SimpleRule,
  SimpleStep,
  SimpleExampleGroup,
  SimpleLocation,
  SimpleComment
} from './types';

/**
 * Helper function to convert SimpleLocation to messages.Location
 */
function convertSimpleLocation(location?: SimpleLocation): messages.Location {
  return {
    line: location?.line || 1,
    column: location?.column || 1
  };
}

/**
 * Helper function to convert SimpleComment array to messages.Comment array
 */
function convertSimpleComments(comments: SimpleComment[]): messages.Comment[] {
  return comments.map(comment => ({
    location: convertSimpleLocation(comment.location),
    text: comment.text
  }));
}

/**
 * Converts simplified format back to Cucumber AST
 */
export function simpleToAst(simple: SimpleFeature): messages.GherkinDocument {
  const children: messages.FeatureChild[] = [];

  // Add background if present
  if (simple.background) {
    children.push({
      background: convertSimpleToBackground(simple.background)
    });
  }

  // Add elements
  for (const element of simple.elements || []) {
    if ('steps' in element && !('exampleGroups' in element) && !('elements' in element)) {
      // It's a scenario
      children.push({
        scenario: convertSimpleToScenario(element)
      });
    } else if ('exampleGroups' in element && !('elements' in element)) {
      // It's a scenario outline
      children.push({
        scenario: convertSimpleToScenarioOutline(element)
      });
    } else if ('elements' in element && Array.isArray(element.elements)) {
      // It's a rule
      children.push({
        rule: convertSimpleToRule(element as SimpleRule)
      });
    }
  }

  const feature: messages.Feature = {
    location: convertSimpleLocation(simple.location),
    tags: simple.tags.map((tag) => ({
      location: convertSimpleLocation(simple.location), // Use feature location for tags
      name: tag,
      id: uuid()
    })),
    language: simple.language || 'en',
    keyword: simple.keyword,
    name: simple.name,
    description: simple.description || '',
    children
  };

  return {
    feature,
    comments: convertSimpleComments(simple.comments),
    uri: simple.uri || ''
  };
}

/**
 * Converts simplified format back to gherkin string
 */
export function simpleToGherkin(simple: SimpleFeature): string {
  let gherkinText = '';
  
  // Add language directive if not English
  if (simple.language && simple.language !== 'en') {
    gherkinText += `# language: ${simple.language}\n`;
  }
  
  // Add tags
  if (simple.tags.length > 0) {
    gherkinText += simple.tags.join(' ') + '\n';
  }
  
  // Add feature using stored keyword
  gherkinText += `${simple.keyword}: ${simple.name}\n`;
  
  if (simple.description) {
    gherkinText += `  ${simple.description.split('\n').join('\n  ')}\n`;
  }
  
  gherkinText += '\n';
  
  // Add background
  if (simple.background) {
    gherkinText += formatScenario(simple.background, simple.background.keyword || 'Background');
  }
  
  // Add elements
  for (const element of simple.elements || []) {
    if ('steps' in element && !('exampleGroups' in element) && !('elements' in element)) {
      // It's a scenario
      gherkinText += formatScenario(element, element.keyword);
    } else if ('exampleGroups' in element && !('elements' in element)) {
      // It's a scenario outline
      gherkinText += formatScenarioOutline(element);
    } else if ('elements' in element && Array.isArray(element.elements)) {
      // It's a rule
      gherkinText += formatRule(element as SimpleRule);
    }
  }
  
  return gherkinText;
}

function convertSimpleToBackground(simple: SimpleScenario): messages.Background {
  return {
    location: { line: 1, column: 1 },
    keyword: simple.keyword,
    name: simple.name,
    description: simple.description || '',
    steps: simple.steps.map(convertSimpleToStep),
    id: uuid()
  };
}

function convertSimpleToRule(simple: SimpleRule): messages.Rule {
  const children: messages.RuleChild[] = [];

  // Add background if present
  if (simple.background) {
    children.push({
      background: convertSimpleToBackground(simple.background)
    });
  }

  // Add rule elements
  for (const element of simple.elements || []) {
    if ('steps' in element && !('exampleGroups' in element)) {
      // It's a scenario
      children.push({
        scenario: convertSimpleToScenario(element)
      });
    } else if ('exampleGroups' in element) {
      // It's a scenario outline
      children.push({
        scenario: convertSimpleToScenarioOutline(element)
      });
    }
  }

  return {
    location: { line: 1, column: 1 },
    tags: simple.tags.map(tag => ({
      location: { line: 1, column: 1 },
      name: tag,
      id: uuid()
    })),
    keyword: simple.keyword,
    name: simple.name,
    description: simple.description || '',
    children,
    id: uuid()
  };
}

function convertSimpleToScenario(simple: SimpleScenario): messages.Scenario {
  return {
    location: convertSimpleLocation(simple.location),
    tags: simple.tags.map(tag => ({
      location: convertSimpleLocation(simple.location), // Use scenario location for tags
      name: tag,
      id: uuid()
    })),
    keyword: simple.keyword,
    name: simple.name,
    description: simple.description || '',
    steps: simple.steps.map(convertSimpleToStep),
    examples: [], // Regular scenarios don't have examples
    id: uuid()
  };
}

function convertSimpleToScenarioOutline(simple: SimpleScenarioOutline): messages.Scenario {
  return {
    location: { line: 1, column: 1 },
    tags: simple.tags.map(tag => ({
      location: { line: 1, column: 1 },
      name: tag,
      id: uuid()
    })),
    keyword: simple.keyword,
    name: simple.name,
    description: simple.description || '',
    steps: simple.steps.map(convertSimpleToStep),
    examples: simple.exampleGroups?.map(convertSimpleExampleGroupToExamples) || [],
    id: uuid()
  };
}

function convertSimpleToStep(simple: SimpleStep): messages.Step {
  const step: messages.Step = {
    location: convertSimpleLocation(simple.location),
    keyword: simple.keyword,
    text: simple.text,
    id: uuid()
  };

  if (simple.docString) {
    const docString: messages.DocString = {
      location: convertSimpleLocation(simple.location), // Use step location for docstring
      content: simple.docString.content,
      delimiter: '"""'
    };
    if (simple.docString.mediaType) {
      docString.mediaType = simple.docString.mediaType;
    }
    step.docString = docString;
  }

  if (simple.dataTable) {
    step.dataTable = {
      location: { line: 1, column: 1 },
      rows: simple.dataTable.map(row => ({
        location: { line: 1, column: 1 },
        cells: row.map(cell => ({
          location: { line: 1, column: 1 },
          value: cell
        })),
        id: uuid()
      }))
    };
  }

  return step;
}

function convertSimpleExampleGroupToExamples(simple: SimpleExampleGroup): messages.Examples {
  const tableHeader: messages.TableRow = {
    location: { line: 1, column: 1 },
    cells: simple.tableHeader.map(header => ({
      location: { line: 1, column: 1 },
      value: header
    })),
    id: uuid()
  };

  const tableBody: messages.TableRow[] = simple.tableBody.map(row => ({
    location: { line: 1, column: 1 },
    cells: row.map(cell => ({
      location: { line: 1, column: 1 },
      value: cell
    })),
    id: uuid()
  }));

  return {
    location: { line: 1, column: 1 },
    tags: simple.tags.map(tag => ({
      location: { line: 1, column: 1 },
      name: tag,
      id: uuid()
    })),
    keyword: simple.keyword,
    name: simple.name || '',
    description: simple.description || '',
    tableHeader,
    tableBody,
    id: uuid()
  };
}

function formatScenario(scenario: SimpleScenario, keyword: string, indent = ''): string {
  let text = '';
  
  // Add tags
  if (scenario.tags.length > 0) {
    text += `${indent}  ${scenario.tags.join(' ')}\n`;
  }
  
  // Add scenario header
  text += `${indent}  ${keyword}: ${scenario.name}\n`;
  
  // Add description
  if (scenario.description) {
    text += `${indent}    ${scenario.description.split('\n').join(`\n${indent}    `)}\n`;
  }
  
  // Add steps
  for (const step of scenario.steps) {
    text += `${indent}    ${step.keyword}${step.text}\n`;
    
    // Add doc string
    if (step.docString) {
      text += `${indent}      """\n`;
      text += `${indent}      ${step.docString.content.split('\n').join(`\n${indent}      `)}\n`;
      text += `${indent}      """\n`;
    }
    
    // Add data table
    if (step.dataTable) {
      for (const row of step.dataTable) {
        text += `${indent}      | ${row.join(' | ')} |\n`;
      }
    }
  }
  
  text += '\n';
  return text;
}

function formatScenarioOutline(scenarioOutline: SimpleScenarioOutline, indent = ''): string {
  let text = '';
  
  // Add tags
  if (scenarioOutline.tags.length > 0) {
    text += `${indent}  ${scenarioOutline.tags.join(' ')}\n`;
  }
  
  // Add scenario outline header
  text += `${indent}  ${scenarioOutline.keyword}: ${scenarioOutline.name}\n`;
  
  // Add description
  if (scenarioOutline.description) {
    text += `${indent}    ${scenarioOutline.description.split('\n').join(`\n${indent}    `)}\n`;
  }
  
  // Add steps
  for (const step of scenarioOutline.steps) {
    text += `${indent}    ${step.keyword}${step.text}\n`;
    
    // Add doc string
    if (step.docString) {
      text += `${indent}      """\n`;
      text += `${indent}      ${step.docString.content.split('\n').join(`\n${indent}      `)}\n`;
      text += `${indent}      """\n`;
    }
    
    // Add data table
    if (step.dataTable) {
      for (const row of step.dataTable) {
        text += `${indent}      | ${row.join(' | ')} |\n`;
      }
    }
  }
  
  // Add example groups
  for (const exampleGroup of scenarioOutline.exampleGroups) {
    text += `${indent}    ${exampleGroup.keyword}:`;
    if (exampleGroup.name) {
      text += ` ${exampleGroup.name}`;
    }
    text += '\n';
    
    // Add example tags
    if (exampleGroup.tags.length > 0) {
      text += `${indent}      ${exampleGroup.tags.join(' ')}\n`;
    }
    
    // Add example description
    if (exampleGroup.description) {
      text += `${indent}      ${exampleGroup.description.split('\n').join(`\n${indent}      `)}\n`;
    }
    
    // Add table header
    if (exampleGroup.tableHeader.length > 0) {
      text += `${indent}      | ${exampleGroup.tableHeader.join(' | ')} |\n`;
    }
    
    // Add table body
    for (const row of exampleGroup.tableBody) {
      text += `${indent}      | ${row.join(' | ')} |\n`;
    }
  }
  
  text += '\n';
  return text;
}

function formatRule(rule: SimpleRule): string {
  let text = '';
  
  // Add tags
  if (rule.tags.length > 0) {
    text += `  ${rule.tags.join(' ')}\n`;
  }
  
  // Add rule header
  text += `  ${rule.keyword}: ${rule.name}\n`;
  
  // Add description
  if (rule.description) {
    text += `    ${rule.description.split('\n').join('\n    ')}\n`;
  }
  
  text += '\n';
  
  // Add background
  if (rule.background) {
    text += formatScenario(rule.background, rule.background.keyword || 'Background', '  ');
  }
  
  // Add rule elements
  for (const element of rule.elements || []) {
    if ('steps' in element && !('exampleGroups' in element)) {
      // It's a scenario
      text += formatScenario(element, element.keyword, '  ');
    } else if ('exampleGroups' in element) {
      // It's a scenario outline
      text += formatScenarioOutline(element, '  ');
    }
  }
  
  return text;
}
