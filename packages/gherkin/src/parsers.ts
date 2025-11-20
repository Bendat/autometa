/**
 * Gherkin parsing functions - convert from Cucumber AST to Simple format
 */

import * as gherkin from '@cucumber/gherkin';
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
  SimpleComment,
  SimpleParseError,
  SimpleDocString,
  SimpleCompiledScenario
} from './types';
import { generateId, _combineAncestorTags } from './utils';

/**
 * Custom error class for Gherkin parsing errors with enhanced details
 */
export class GherkinParseError extends Error {
  public errors: SimpleParseError[];
  
  constructor(message: string, errors: SimpleParseError[] = []) {
    super(message);
    this.name = 'GherkinParseError';
    this.errors = errors;
  }
  
  /**
   * Get a formatted error message with all parse errors
   */
  getDetailedMessage(): string {
    if (this.errors.length === 0) {
      return this.message;
    }
    
    let message = this.message + '\n\nParse errors:\n';
    this.errors.forEach((error, index) => {
      message += `${index + 1}. ${error.message}`;
      if (error.line !== undefined) {
        message += ` (line ${error.line}`;
        if (error.column !== undefined) {
          message += `, column ${error.column}`;
        }
        message += ')';
      }
      message += '\n';
    });
    
    return message.trim();
  }
}

/**
 * Parse options for Gherkin parsing
 */
export interface ParseOptions {
  /** Default language to use if not specified in the Gherkin content */
  defaultLanguage?: string;
}

export function parseGherkin(content: string, options?: ParseOptions): SimpleFeature {
  const builder = new gherkin.AstBuilder(uuid);
  const matcher = new gherkin.GherkinClassicTokenMatcher(options?.defaultLanguage);
  const parser = new gherkin.Parser(builder, matcher);
  
  try {
    const gherkinDocument = parser.parse(content);
    return astToSimple(gherkinDocument);
  } catch (error) {
    const parseErrors = extractParseErrors(error, content);
    throw new GherkinParseError('Failed to parse gherkin content', parseErrors);
  }
}

/**
 * Extract detailed parse error information from Gherkin parser errors
 */
function extractParseErrors(error: unknown, source: string): SimpleParseError[] {
  const parseErrors: SimpleParseError[] = [];
  
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    
    // Handle Gherkin CompositeParserException
    if (errorObj.errors && Array.isArray(errorObj.errors)) {
      errorObj.errors.forEach((err: unknown) => {
        parseErrors.push(createParseError(err, source));
      });
    } 
    // Handle Gherkin ParserException
    else if (errorObj.location || errorObj.message) {
      parseErrors.push(createParseError(error, source));
    }
    // Handle generic errors
    else {
      const firstLine = source.split('\n')[0];
      const parseErr: SimpleParseError = {
        message: (errorObj.message as string) || String(error)
      };
      if (firstLine) {
        parseErr.source = firstLine;
      }
      parseErrors.push(parseErr);
    }
  } else {
    const firstLine = source.split('\n')[0];
    const parseErr: SimpleParseError = {
      message: String(error)
    };
    if (firstLine) {
      parseErr.source = firstLine;
    }
    parseErrors.push(parseErr);
  }
  
  return parseErrors;
}

/**
 * Create a detailed parse error from a Gherkin parser error
 */
function createParseError(error: unknown, source: string): SimpleParseError {
  const errorObj = error && typeof error === 'object' ? error as Record<string, unknown> : {};
  
  const parseError: SimpleParseError = {
    message: (errorObj.message as string) || 'Unknown parse error'
  };
  
  // Extract location information
  if (errorObj.location && typeof errorObj.location === 'object') {
    const location = errorObj.location as Record<string, unknown>;
    const line = typeof location.line === 'number' ? location.line : 0;
    const column = typeof location.column === 'number' ? location.column : 0;
    
    parseError.location = { line, column };
    parseError.line = line;
    parseError.column = column;
    
    // Add source context around the error location
    if (line > 0) {
      const lines = source.split('\n');
      const errorLine = lines[line - 1];
      if (errorLine) {
        parseError.source = errorLine.trim();
      }
    }
  }
  
  return parseError;
}

/**
 * Converts Cucumber AST to simplified format
 */
export function astToSimple(gherkinDocument: messages.GherkinDocument): SimpleFeature {
  const feature = gherkinDocument.feature;
  if (!feature) {
    throw new Error('No feature found in gherkin document');
  }

  const featureTags = feature.tags?.map(tag => tag.name || '') || [];
  
  const simpleFeature: SimpleFeature = {
    id: generateId(feature),
    keyword: feature.keyword || 'Feature',
    language: feature.language || 'en',
    name: feature.name || '',
    description: feature.description?.trim(),
    tags: featureTags,
    elements: [],
    comments: convertComments([...gherkinDocument.comments || []])
  };

  // Add location if available
  const location = convertLocation(feature.location);
  if (location) {
    simpleFeature.location = location;
  }

  if (gherkinDocument.uri) {
    simpleFeature.uri = gherkinDocument.uri;
  }

  // Process children (scenarios, backgrounds, rules, etc.)
  for (const child of feature.children || []) {
    if (child.scenario) {
      // Check if it's a scenario outline
      const isOutline = child.scenario.keyword?.toLowerCase().includes('outline') || 
                       child.scenario.keyword?.toLowerCase().includes('esquema') ||
                       child.scenario.keyword?.toLowerCase().includes('plan') ||
                       child.scenario.keyword?.toLowerCase().includes('szenariogrundriss') ||
                       (child.scenario.examples && child.scenario.examples.length > 0);
      
      if (isOutline) {
        const scenarioOutline = convertScenarioOutline(child.scenario, featureTags);
        simpleFeature.elements.push(scenarioOutline);
      } else {
        const scenario = convertScenario(child.scenario, featureTags);
        simpleFeature.elements.push(scenario);
      }
    } else if (child.background) {
      simpleFeature.background = convertBackground(child.background, featureTags);
    } else if (child.rule) {
      const rule = convertRule(child.rule, featureTags);
      simpleFeature.elements.push(rule);
    }
  }

  return simpleFeature;
}

function convertScenario(scenario: messages.Scenario, ancestorTags: string[]): SimpleScenario {
  const scenarioTags = scenario.tags?.map(tag => tag.name || '') || [];
  const allTags = _combineAncestorTags(ancestorTags, scenarioTags);
  
  const result: SimpleScenario = {
    id: generateId(scenario),
    keyword: scenario.keyword || 'Scenario',
    name: scenario.name || '',
    description: scenario.description?.trim(),
    tags: allTags,
    steps: scenario.steps?.map(step => convertStep(step)) || []
  };

  const location = convertLocation(scenario.location);
  if (location) {
    result.location = location;
  }

  return result;
}

function convertScenarioOutline(scenario: messages.Scenario, ancestorTags: string[]): SimpleScenarioOutline {
  const scenarioTags = scenario.tags?.map(tag => tag.name || '') || [];
  const allTags = _combineAncestorTags(ancestorTags, scenarioTags);
  
  const exampleGroups = scenario.examples?.map(example => convertExampleGroup(example, allTags, scenario.name || '')) || [];
  
  const scenarioOutline: SimpleScenarioOutline = {
    id: generateId(scenario),
    keyword: scenario.keyword || 'Scenario Outline',
    name: scenario.name || '',
    description: scenario.description?.trim(),
    tags: allTags,
    steps: scenario.steps?.map(step => convertStep(step)) || [],
    exampleGroups,
    compiledScenarios: []
  };

  const location = convertLocation(scenario.location);
  if (location) {
    scenarioOutline.location = location;
  }

  // Generate compiled scenarios
  scenarioOutline.compiledScenarios = generateCompiledScenarios(scenarioOutline);
  
  return scenarioOutline;
}

function convertBackground(_background: messages.Background, _ancestorTags: string[]): SimpleScenario {
  const result: SimpleScenario = {
    id: generateId(_background),
    keyword: _background.keyword || 'Background',
    name: _background.name || '',
    description: _background.description?.trim(),
    tags: [],
    steps: _background.steps?.map(convertStep) || []
  };

  const location = convertLocation(_background.location);
  if (location) {
    result.location = location;
  }

  return result;
}

function convertRule(rule: messages.Rule, ancestorTags: string[]): SimpleRule {
  const ruleTags = rule.tags?.map(tag => tag.name || '') || [];
  const allTags = _combineAncestorTags(ancestorTags, ruleTags);

  const simpleRule: SimpleRule = {
    id: generateId(rule),
    keyword: rule.keyword || 'Rule',
    name: rule.name || '',
    description: rule.description?.trim(),
    tags: allTags,
    elements: []
  };

  const location = convertLocation(rule.location);
  if (location) {
    simpleRule.location = location;
  }

  // Process rule children
  for (const child of rule.children || []) {
    if (child.scenario) {
      // Check if it's a scenario outline
      const isOutline = child.scenario.keyword?.toLowerCase().includes('outline') || 
                       child.scenario.keyword?.toLowerCase().includes('esquema') ||
                       child.scenario.keyword?.toLowerCase().includes('plan') ||
                       child.scenario.keyword?.toLowerCase().includes('szenariogrundriss') ||
                       (child.scenario.examples && child.scenario.examples.length > 0);
      
      if (isOutline) {
        const scenarioOutline = convertScenarioOutline(child.scenario, allTags);
        simpleRule.elements.push(scenarioOutline);
      } else {
        const scenario = convertScenario(child.scenario, allTags);
        simpleRule.elements.push(scenario);
      }
    } else if (child.background) {
      simpleRule.background = convertBackground(child.background, allTags);
    }
  }

  return simpleRule;
}

function convertStep(step: messages.Step): SimpleStep {
  const result: SimpleStep = {
    id: generateId(step),
    keyword: step.keyword || '',
    text: step.text || ''
  };

  const location = convertLocation(step.location);
  if (location) {
    result.location = location;
  }

  if (step.docString?.content) {
    const docString: SimpleDocString = {
      content: step.docString.content
    };
    if (step.docString.mediaType) {
      docString.mediaType = step.docString.mediaType;
    }
    result.docString = docString;
  }

  if (step.dataTable?.rows) {
    result.dataTable = step.dataTable.rows.map(row => 
      row.cells?.map(cell => cell.value || '') || []
    );
  }

  return result;
}

function convertExampleGroup(examples: messages.Examples, ancestorTags: string[], _outlineName: string): SimpleExampleGroup {
  const exampleTags = examples.tags?.map(tag => tag.name || '') || [];
  const allTags = _combineAncestorTags(ancestorTags, exampleTags);
  
  const tableHeader = examples.tableHeader?.cells?.map(cell => cell.value || '') || [];
  const tableBody = examples.tableBody?.map(row => 
    row.cells?.map(cell => cell.value || '') || []
  ) || [];

  const result: SimpleExampleGroup = {
    id: generateId(examples),
    keyword: examples.keyword || 'Examples',
    name: examples.name || '',
    description: examples.description?.trim(),
    tags: allTags,
    tableHeader,
    tableBody
  };

  const location = convertLocation(examples.location);
  if (location) {
    result.location = location;
  }

  return result;
}

function generateCompiledScenarios(scenarioOutline: SimpleScenarioOutline): SimpleCompiledScenario[] {
  const compiledScenarios: SimpleCompiledScenario[] = [];
  
  for (const exampleGroup of scenarioOutline.exampleGroups) {
    for (let exampleIndex = 0; exampleIndex < exampleGroup.tableBody.length; exampleIndex++) {
      const exampleRow = exampleGroup.tableBody[exampleIndex];
      
      if (!exampleRow) continue;
      
      // Create parameter map
      const paramMap: Record<string, string> = {};
      for (let i = 0; i < exampleGroup.tableHeader.length; i++) {
        const header = exampleGroup.tableHeader[i];
        const value = exampleRow[i];
        if (header && value !== undefined) {
          paramMap[header] = value;
        }
      }
      
      // Generate interpolated name
      const interpolatedName = interpolateString(scenarioOutline.name, paramMap);
      
      // Generate interpolated description
      const interpolatedDescription = scenarioOutline.description 
        ? interpolateString(scenarioOutline.description, paramMap)
        : undefined;
      
      // Generate interpolated steps
      const interpolatedSteps: SimpleStep[] = scenarioOutline.steps.map(step => {
        const interpolatedStep: SimpleStep = {
          id: generateId({ text: interpolateString(step.text, paramMap) }),
          keyword: step.keyword,
          text: interpolateString(step.text, paramMap)
        };

        if (step.location) {
          interpolatedStep.location = { ...step.location };
        }
        
        if (step.docString) {
          interpolatedStep.docString = {
            content: interpolateString(step.docString.content, paramMap),
            ...(step.docString.mediaType && { mediaType: step.docString.mediaType })
          };
        }
        
        if (step.dataTable) {
          interpolatedStep.dataTable = step.dataTable.map(row => 
            row.map(cell => interpolateString(cell, paramMap))
          );
        }
        
        return interpolatedStep;
      });
      
      const compiledScenario: SimpleCompiledScenario = {
        id: generateId({ name: interpolatedName }),
        keyword: scenarioOutline.keyword,
        name: interpolatedName,
        tags: _combineAncestorTags(scenarioOutline.tags, exampleGroup.tags),
        steps: interpolatedSteps,
        exampleIndex,
        exampleGroupId: exampleGroup.id,
        scenarioOutlineId: scenarioOutline.id
      };
      
      if (interpolatedDescription) {
        compiledScenario.description = interpolatedDescription;
      }
      
      compiledScenarios.push(compiledScenario);
    }
  }
  
  return compiledScenarios;
}

function interpolateString(template: string, paramMap: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(paramMap)) {
    const regex = new RegExp(`<${key}>`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

function convertLocation(location: messages.Location | undefined): SimpleLocation | undefined {
  if (!location) return undefined;
  return {
    line: location.line,
    column: location.column || 1
  };
}

function convertComments(comments: messages.Comment[]): SimpleComment[] {
  return comments.map(comment => ({
    location: {
      line: comment.location.line,
      column: comment.location.column || 1
    },
    text: comment.text
  }));
}
