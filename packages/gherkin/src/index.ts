/**
 * @autometa/gherkin - Enhanced Gherkin parsing and query library
 * 
 * This library provides a simplified interface for parsing Gherkin features
 * and powerful querying capabilities for test automation tools.
 */

// Export version
export { version } from './utils';

// Export all types
export * from './types';

// Export parsing functions
export { parseGherkin, astToSimple, GherkinParseError, type ParseOptions } from './parsers';

// Export conversion functions
export { simpleToAst, simpleToGherkin } from './converters';

// Export query engine
export { 
  QueryEngine,
  createQueryEngine
} from './query-engine';

// Export pickle generation
export { 
  PickleGenerator,
  generatePickles,
  generatePickleById
} from './pickle-generator';

// Export utility functions
export { generateId } from './utils';

// Export dialects for localization support
export { dialects } from '@cucumber/gherkin';
