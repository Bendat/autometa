/**
 * Pickle generation for test execution context
 */

import { 
  SimpleFeature, 
  SimpleScenario, 
  SimpleScenarioOutline, 
  SimpleRule,
  SimpleStep,
  SimplePickle,
  SimplePickleStep,
  SimplePickleFeatureRef,
  SimplePickleScenarioRef,
  SimplePickleRuleRef,
  SimpleCompiledScenario
} from './types';
import { generateId } from './utils';

/**
 * Generates pickle-like structures for test execution with full context
 */
export class PickleGenerator {
  constructor(private feature: SimpleFeature) {}

  /**
   * Generate all pickles from the feature
   */
  generatePickles(): SimplePickle[] {
    const pickles: SimplePickle[] = [];

    // Generate feature reference
    const featureRef = this.createFeatureRef();

    // Generate pickles from all elements in order
    for (const element of this.feature.elements || []) {
      if ('exampleGroups' in element) {
        // Scenario outline
        const expandedPickles = this.generatePicklesFromOutline(element, featureRef);
        pickles.push(...expandedPickles);
      } else if ('steps' in element) {
        // Scenario
        const pickle = this.generatePickleFromScenario(element, featureRef);
        pickles.push(pickle);
      } else {
        // Rule
        const rulePickles = this.generatePicklesFromRule(element, featureRef);
        pickles.push(...rulePickles);
      }
    }

    return pickles;
  }

  /**
   * Generate pickle by scenario ID
   */
  generatePickleById(scenarioId: string): SimplePickle | null {
    const featureRef = this.createFeatureRef();

    // Check feature-level elements
    for (const element of this.feature.elements || []) {
      if ('steps' in element && element.id === scenarioId) {
        // Found scenario
        return this.generatePickleFromScenario(element, featureRef);
      } else if ('exampleGroups' in element) {
        // Check compiled scenarios in outline
        const compiledScenario = element.compiledScenarios?.find((cs: SimpleCompiledScenario) => cs.id === scenarioId);
        if (compiledScenario) {
          return this.generatePickleFromCompiledScenario(compiledScenario, element, featureRef);
        }
      } else if ('elements' in element) {
        // It's a rule, check its elements
        for (const ruleElement of element.elements || []) {
          if ('steps' in ruleElement && ruleElement.id === scenarioId) {
            // Found scenario in rule
            const ruleRef = this.createRuleRef(element);
            return this.generatePickleFromScenario(ruleElement, featureRef, ruleRef);
          } else if ('exampleGroups' in ruleElement) {
            // Check compiled scenarios in rule outline
            const compiledScenario = ruleElement.compiledScenarios?.find((cs: SimpleCompiledScenario) => cs.id === scenarioId);
            if (compiledScenario) {
              const ruleRef = this.createRuleRef(element);
              return this.generatePickleFromCompiledScenario(compiledScenario, ruleElement, featureRef, ruleRef);
            }
          }
        }
      }
    }

    return null;
  }

  private createFeatureRef(): SimplePickleFeatureRef {
    return {
      id: this.feature.id,
      name: this.feature.name,
      location: this.feature.location || { line: 1, column: 1 },
      tags: this.feature.tags,
      comments: this.feature.comments?.map(c => c.text)
    };
  }

  private createRuleRef(rule: SimpleRule): SimplePickleRuleRef {
    return {
      id: rule.id,
      name: rule.name,
      location: rule.location || { line: 1, column: 1 },
      tags: rule.tags
      // Rules don't have comments in current structure
    };
  }

  private createScenarioRef(scenario: SimpleScenario | SimpleScenarioOutline, type: 'scenario' | 'scenario_outline' | 'background' = 'scenario'): SimplePickleScenarioRef {
    return {
      id: scenario.id,
      name: scenario.name,
      location: scenario.location || { line: 1, column: 1 },
      tags: scenario.tags,
      type
      // Scenarios don't have comments in current structure
    };
  }

  private generatePickleFromScenario(
    scenario: SimpleScenario, 
    featureRef: SimplePickleFeatureRef, 
    ruleRef?: SimplePickleRuleRef
  ): SimplePickle {
    const allSteps = this.combineBackgroundAndScenarioSteps(scenario.steps);
    const allTags = this.combineAllTags(featureRef.tags, ruleRef?.tags, scenario.tags);
    const scenarioRef = this.createScenarioRef(scenario);

    const pickle: SimplePickle = {
      id: generateId({ name: `pickle-${scenario.name}` }),
      name: scenario.name,
      language: this.feature.language,
      steps: allSteps.map(step => this.convertToPickleStep(step, featureRef, scenarioRef, ruleRef, allTags)),
      tags: allTags,
      feature: featureRef,
      scenario: scenarioRef
    };

    if (this.feature.uri) {
      pickle.uri = this.feature.uri;
    }

    if (ruleRef) {
      pickle.rule = ruleRef;
    }

    return pickle;
  }

  private generatePicklesFromOutline(
    outline: SimpleScenarioOutline, 
    featureRef: SimplePickleFeatureRef, 
    ruleRef?: SimplePickleRuleRef
  ): SimplePickle[] {
    if (!outline.compiledScenarios || outline.compiledScenarios.length === 0) {
      return [];
    }

    return outline.compiledScenarios.map(compiled => 
      this.generatePickleFromCompiledScenario(compiled, outline, featureRef, ruleRef)
    );
  }

  private generatePickleFromCompiledScenario(
    compiled: SimpleCompiledScenario, 
    outline: SimpleScenarioOutline, 
    featureRef: SimplePickleFeatureRef, 
    ruleRef?: SimplePickleRuleRef
  ): SimplePickle {
    const allSteps = this.combineBackgroundAndScenarioSteps(compiled.steps || []);
    const allTags = this.combineAllTags(featureRef.tags, ruleRef?.tags, outline.tags);
    const scenarioRef = this.createScenarioRef(outline, 'scenario_outline');

    const pickle: SimplePickle = {
      id: compiled.id,
      name: compiled.name,
      language: this.feature.language,
      steps: allSteps.map(step => this.convertToPickleStep(step, featureRef, scenarioRef, ruleRef, allTags)),
      tags: allTags,
      feature: featureRef,
      scenario: scenarioRef
    };

    if (this.feature.uri) {
      pickle.uri = this.feature.uri;
    }

    if (ruleRef) {
      pickle.rule = ruleRef;
    }

    return pickle;
  }

  private generatePicklesFromRule(rule: SimpleRule, featureRef: SimplePickleFeatureRef): SimplePickle[] {
    const pickles: SimplePickle[] = [];
    const ruleRef = this.createRuleRef(rule);

    // Process rule elements
    for (const element of rule.elements || []) {
      if ('steps' in element) {
        // It's a scenario
        const pickle = this.generatePickleFromScenario(element, featureRef, ruleRef);
        pickles.push(pickle);
      } else if ('exampleGroups' in element) {
        // It's a scenario outline
        const expandedPickles = this.generatePicklesFromOutline(element, featureRef, ruleRef);
        pickles.push(...expandedPickles);
      }
    }

    return pickles;
  }

  private combineBackgroundAndScenarioSteps(scenarioSteps: SimpleStep[]): SimpleStep[] {
    const backgroundSteps = this.feature.background?.steps || [];
    return [...backgroundSteps, ...scenarioSteps];
  }

  private combineAllTags(featureTags: string[], ruleTags?: string[], scenarioTags?: string[]): string[] {
    const allTags = [...featureTags];
    if (ruleTags) allTags.push(...ruleTags);
    if (scenarioTags) allTags.push(...scenarioTags);
    return Array.from(new Set(allTags)); // Remove duplicates
  }

  private convertToPickleStep(
    step: SimpleStep,
    featureRef: SimplePickleFeatureRef,
    scenarioRef: SimplePickleScenarioRef,
    ruleRef: SimplePickleRuleRef | undefined,
    allTags: string[]
  ): SimplePickleStep {
    const pickleStep: SimplePickleStep = {
      id: step.id,
      text: step.text,
      keyword: step.keyword,
      keywordType: this.getKeywordType(step.keyword),
      type: this.getStepType(step.keyword),
      location: step.location || { line: 1, column: 1 },
      astNodeIds: [step.id],
      scenario: scenarioRef,
      feature: featureRef,
      tags: allTags,
      language: this.feature.language
    };

    // Add optional properties only if they exist
    if (step.dataTable) {
      pickleStep.dataTable = step.dataTable;
    }
    
    if (step.docString?.content) {
      pickleStep.docString = step.docString.content;
    }
    
    if (ruleRef) {
      pickleStep.rule = ruleRef;
    }
    
    if (this.feature.uri) {
      pickleStep.uri = this.feature.uri;
    }

    return pickleStep;
  }

  private getKeywordType(keyword: string): string {
    const normalizedKeyword = keyword.trim().toLowerCase();
    
    if (normalizedKeyword.startsWith('given') || normalizedKeyword.startsWith('soit')) {
      return 'context';
    }
    if (normalizedKeyword.startsWith('when') || normalizedKeyword.startsWith('quand')) {
      return 'action';
    }
    if (normalizedKeyword.startsWith('then') || normalizedKeyword.startsWith('alors')) {
      return 'outcome';
    }
    if (normalizedKeyword.startsWith('and') || normalizedKeyword.startsWith('et')) {
      return 'conjunction';
    }
    if (normalizedKeyword.startsWith('but') || normalizedKeyword.startsWith('mais')) {
      return 'conjunction';
    }
    
    return 'unknown';
  }

  private getStepType(keyword: string): 'context' | 'action' | 'outcome' {
    const keywordType = this.getKeywordType(keyword);
    
    switch (keywordType) {
      case 'context': return 'context';
      case 'action': return 'action';
      case 'outcome': return 'outcome';
      default: return 'action'; // Default for conjunctions and unknowns
    }
  }
}

/**
 * Convenience function to generate pickles from a feature
 */
export function generatePickles(feature: SimpleFeature): SimplePickle[] {
  const generator = new PickleGenerator(feature);
  return generator.generatePickles();
}

/**
 * Convenience function to generate a specific pickle by scenario ID
 */
export function generatePickleById(feature: SimpleFeature, scenarioId: string): SimplePickle | null {
  const generator = new PickleGenerator(feature);
  return generator.generatePickleById(scenarioId);
}
