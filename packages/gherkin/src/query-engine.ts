/**
 * Query engine for searching Gherkin features
 */

import { 
  SimpleFeature, 
  SimpleScenario, 
  SimpleScenarioOutline, 
  SimpleRule,
  SimpleStep,
  QueryResult,
  QueryOptions,
  TagQueryOptions
} from './types';

/**
 * Comprehensive Query Engine for Gherkin Features
 */
export class QueryEngine {
  constructor(private feature: SimpleFeature) {}

  /**
   * Helper method to iterate over all scenarios in the feature
   */
  private _getAllScenarios(): SimpleScenario[] {
    const scenarios: SimpleScenario[] = [];
    
    for (const element of this.feature.elements || []) {
      if ('steps' in element && !('exampleGroups' in element) && !('elements' in element)) {
        scenarios.push(element);
      } else if ('elements' in element && Array.isArray(element.elements)) {
        // It's a rule, check its elements
        const rule = element as SimpleRule;
        for (const ruleElement of rule.elements || []) {
          if ('steps' in ruleElement && !('exampleGroups' in ruleElement)) {
            scenarios.push(ruleElement);
          }
        }
      }
    }
    
    return scenarios;
  }

  /**
   * Helper method to iterate over all scenario outlines in the feature
   */
  private _getAllScenarioOutlines(): SimpleScenarioOutline[] {
    const scenarioOutlines: SimpleScenarioOutline[] = [];
    
    for (const element of this.feature.elements || []) {
      if ('exampleGroups' in element && !('elements' in element)) {
        scenarioOutlines.push(element);
      } else if ('elements' in element && Array.isArray(element.elements)) {
        // It's a rule, check its elements
        const rule = element as SimpleRule;
        for (const ruleElement of rule.elements || []) {
          if ('exampleGroups' in ruleElement) {
            scenarioOutlines.push(ruleElement);
          }
        }
      }
    }
    
    return scenarioOutlines;
  }

  /**
   * Helper method to get all rules in the feature
   */
  private _getAllRules(): SimpleRule[] {
    const rules: SimpleRule[] = [];
    
    for (const element of this.feature.elements || []) {
      if ('elements' in element && Array.isArray(element.elements)) {
        rules.push(element as SimpleRule);
      }
    }
    
    return rules;
  }

  /**
   * Find any element by ID
   */
  findById(id: string): QueryResult | null {
    // Check feature itself
    if (this.feature.id === id) {
      return {
        feature: this.feature,
        path: 'feature'
      };
    }

    // Check background
    if (this.feature.background?.id === id) {
      return {
        feature: this.feature,
        scenario: this.feature.background,
        path: 'background'
      };
    }

    // Check feature-level elements
    for (let i = 0; i < (this.feature.elements || []).length; i++) {
      const element = this.feature.elements?.[i];
      if (!element) continue;

      // Type guard for scenario (has steps but not exampleGroups or elements)
      if ('steps' in element && !('exampleGroups' in element) && !('elements' in element)) {
        const result = this.searchInScenario(element, id, `elements[${i}]`);
        if (result) return result;
      }
      // Type guard for scenario outline (has exampleGroups but not elements)
      else if ('exampleGroups' in element && !('elements' in element)) {
        const result = this.searchInScenarioOutline(element, id, `elements[${i}]`);
        if (result) return result;
      }
      // Type guard for rule (has elements property)
      else if ('elements' in element && Array.isArray(element.elements)) {
        const rule = element as SimpleRule;
        
        if (rule.id === id) {
          return {
            feature: this.feature,
            rule,
            path: `elements[${i}]`
          };
        }

        // Check rule background
        if (rule.background?.id === id) {
          return {
            feature: this.feature,
            rule,
            scenario: rule.background,
            path: `elements[${i}].background`
          };
        }

        // Check rule elements
        for (let j = 0; j < (rule.elements || []).length; j++) {
          const ruleElement = rule.elements?.[j];
          if (!ruleElement) continue;

          if ('steps' in ruleElement && !('exampleGroups' in ruleElement)) {
            // It's a scenario in rule
            const result = this.searchInScenario(ruleElement, id, `elements[${i}].elements[${j}]`);
            if (result) {
              result.rule = rule;
              return result;
            }
          } else if ('exampleGroups' in ruleElement) {
            // It's a scenario outline in rule
            const result = this.searchInScenarioOutline(ruleElement, id, `elements[${i}].elements[${j}]`);
            if (result) {
              result.rule = rule;
              return result;
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Find elements by keyword and name combination
   */
  findByKeywordAndName(keyword: string, name: string, options: QueryOptions = {}): QueryResult[] {
    const normalizedKeyword = options.caseSensitive ? keyword : keyword.toLowerCase();
    const normalizedName = options.caseSensitive ? name : name.toLowerCase();
    const results: QueryResult[] = [];

    // Helper function to check if keyword matches
    const keywordMatches = (itemKeyword: string): boolean => {
      const normalizedItemKeyword = options.caseSensitive ? itemKeyword : itemKeyword.toLowerCase();
      return normalizedItemKeyword === normalizedKeyword;
    };

    // Helper function to check if name matches
    const nameMatches = (itemName: string): boolean => {
      const normalizedItemName = options.caseSensitive ? itemName : itemName.toLowerCase();
      if (options.exactMatch) {
        return normalizedItemName === normalizedName;
      }
      return normalizedItemName.includes(normalizedName);
    };

    // Check feature
    if (keywordMatches(this.feature.keyword) && nameMatches(this.feature.name)) {
      results.push({
        feature: this.feature,
        path: ''
      });
    }

    // Check background
    if (this.feature.background && keywordMatches(this.feature.background.keyword) && nameMatches(this.feature.background.name)) {
      results.push({
        feature: this.feature,
        scenario: this.feature.background,
        path: 'background'
      });
    }

    // Check elements
    for (let i = 0; i < (this.feature.elements || []).length; i++) {
      const element = this.feature.elements?.[i];
      if (!element) continue;

      // Type guard for scenario (has steps but not exampleGroups or elements)
      if ('steps' in element && !('exampleGroups' in element) && !('elements' in element)) {
        if (keywordMatches(element.keyword) && nameMatches(element.name)) {
          results.push({
            feature: this.feature,
            scenario: element,
            path: `elements[${i}]`
          });
        }
      }
      // Type guard for scenario outline (has exampleGroups but not elements)
      else if ('exampleGroups' in element && !('elements' in element)) {
        if (keywordMatches(element.keyword) && nameMatches(element.name)) {
          results.push({
            feature: this.feature,
            scenarioOutline: element,
            path: `elements[${i}]`
          });
        }
      }
      // Type guard for rule (has elements property)
      else if ('elements' in element && Array.isArray(element.elements)) {
        const rule = element as SimpleRule;

        // Check rule itself
        if (keywordMatches(rule.keyword) && nameMatches(rule.name)) {
          results.push({
            feature: this.feature,
            rule,
            path: `elements[${i}]`
          });
        }

        // Check rule background
        if (rule.background && keywordMatches(rule.background.keyword) && nameMatches(rule.background.name)) {
          results.push({
            feature: this.feature,
            rule,
            scenario: rule.background,
            path: `elements[${i}].background`
          });
        }

        // Check rule elements
        for (let j = 0; j < (rule.elements || []).length; j++) {
          const ruleElement = rule.elements?.[j];
          if (!ruleElement) continue;

          if ('steps' in ruleElement && !('exampleGroups' in ruleElement)) {
            // It's a scenario in rule
            if (keywordMatches(ruleElement.keyword) && nameMatches(ruleElement.name)) {
              results.push({
                feature: this.feature,
                rule,
                scenario: ruleElement,
                path: `elements[${i}].elements[${j}]`
              });
            }
          } else if ('exampleGroups' in ruleElement) {
            // It's a scenario outline in rule
            if (keywordMatches(ruleElement.keyword) && nameMatches(ruleElement.name)) {
              results.push({
                feature: this.feature,
                rule,
                scenarioOutline: ruleElement,
                path: `elements[${i}].elements[${j}]`
              });
            }
          }
        }
      }
    }

    return results;
  }

  findByName(name: string, options: QueryOptions = {}): QueryResult[] {
    const normalizedName = options.caseSensitive ? name : name.toLowerCase();
    const results: QueryResult[] = [];

    // Helper function to check if name matches
    const nameMatches = (itemName: string): boolean => {
      const normalizedItemName = options.caseSensitive ? itemName : itemName.toLowerCase();
      if (options.exactMatch) {
        return normalizedItemName === normalizedName;
      }
      return normalizedItemName.includes(normalizedName);
    };

    // Check feature
    if (nameMatches(this.feature.name)) {
      results.push({
        feature: this.feature,
        path: ''
      });
    }

    // Check background
    if (this.feature.background && nameMatches(this.feature.background.name)) {
      results.push({
        feature: this.feature,
        scenario: this.feature.background,
        path: 'background'
      });
    }

    // Check elements
    for (let i = 0; i < (this.feature.elements || []).length; i++) {
      const element = this.feature.elements?.[i];
      if (!element) continue;

      // Type guard for scenario
      if ('steps' in element && !('exampleGroups' in element) && !('elements' in element)) {
        if (nameMatches(element.name)) {
          results.push({
            feature: this.feature,
            scenario: element,
            path: `elements[${i}]`
          });
        }
      }
      // Type guard for scenario outline
      else if ('exampleGroups' in element && !('elements' in element)) {
        if (nameMatches(element.name)) {
          results.push({
            feature: this.feature,
            scenarioOutline: element,
            path: `elements[${i}]`
          });
        }
      }
      // Type guard for rule
      else if ('elements' in element && Array.isArray(element.elements)) {
        const rule = element as SimpleRule;

        // Check rule itself
        if (nameMatches(rule.name)) {
          results.push({
            feature: this.feature,
            rule,
            path: `elements[${i}]`
          });
        }

        // Check rule background
        if (rule.background && nameMatches(rule.background.name)) {
          results.push({
            feature: this.feature,
            rule,
            scenario: rule.background,
            path: `elements[${i}].background`
          });
        }

        // Check rule elements
        for (let j = 0; j < (rule.elements || []).length; j++) {
          const ruleElement = rule.elements?.[j];
          if (!ruleElement) continue;

          if ('steps' in ruleElement && !('exampleGroups' in ruleElement)) {
            // It's a scenario in rule
            if (nameMatches(ruleElement.name)) {
              results.push({
                feature: this.feature,
                rule,
                scenario: ruleElement,
                path: `elements[${i}].elements[${j}]`
              });
            }
          } else if ('exampleGroups' in ruleElement) {
            // It's a scenario outline in rule
            if (nameMatches(ruleElement.name)) {
              results.push({
                feature: this.feature,
                rule,
                scenarioOutline: ruleElement,
                path: `elements[${i}].elements[${j}]`
              });
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * Find elements by tags
   */
  findByTags(tags: string[], options: TagQueryOptions = {}): QueryResult[] {
    const results: QueryResult[] = [];
    const { caseSensitive = false, matchMode = 'any' } = options;

    const normalizedSearchTags = caseSensitive ? tags : tags.map(tag => tag.toLowerCase());

    const hasMatchingTags = (targetTags: string[]) => {
      const normalizedTargetTags = caseSensitive ? targetTags : targetTags.map(tag => tag.toLowerCase());
      
      if (matchMode === 'all') {
        return normalizedSearchTags.every(searchTag => normalizedTargetTags.includes(searchTag));
      } else {
        return normalizedSearchTags.some(searchTag => normalizedTargetTags.includes(searchTag));
      }
    };

    // Check feature
    if (hasMatchingTags(this.feature.tags)) {
      results.push({
        feature: this.feature,
        path: 'feature'
      });
    }

    // Check background
    if (this.feature.background && hasMatchingTags(this.feature.background.tags)) {
      results.push({
        feature: this.feature,
        scenario: this.feature.background,
        path: 'background'
      });
    }

    // Check elements
    for (let i = 0; i < (this.feature.elements || []).length; i++) {
      const element = this.feature.elements?.[i];
      if (!element) continue;

      // Type guard for scenario
      if ('steps' in element && !('exampleGroups' in element) && !('elements' in element)) {
        if (hasMatchingTags(element.tags)) {
          results.push({
            feature: this.feature,
            scenario: element,
            path: `elements[${i}]`
          });
        }
      }
      // Type guard for scenario outline
      else if ('exampleGroups' in element && !('elements' in element)) {
        if (hasMatchingTags(element.tags)) {
          results.push({
            feature: this.feature,
            scenarioOutline: element,
            path: `elements[${i}]`
          });
        }

        // Check example groups
        for (let k = 0; k < element.exampleGroups.length; k++) {
          const exampleGroup = element.exampleGroups[k];
          if (exampleGroup && hasMatchingTags(exampleGroup.tags)) {
            results.push({
              feature: this.feature,
              scenarioOutline: element,
              exampleGroup,
              path: `elements[${i}].exampleGroups[${k}]`
            });
          }
        }
      }
      // Type guard for rule
      else if ('elements' in element && Array.isArray(element.elements)) {
        const rule = element as SimpleRule;

        // Check rule itself
        if (hasMatchingTags(rule.tags)) {
          results.push({
            feature: this.feature,
            rule,
            path: `elements[${i}]`
          });
        }

        // Check rule background
        if (rule.background && hasMatchingTags(rule.background.tags)) {
          results.push({
            feature: this.feature,
            rule,
            scenario: rule.background,
            path: `elements[${i}].background`
          });
        }

        // Check rule elements
        for (let j = 0; j < (rule.elements || []).length; j++) {
          const ruleElement = rule.elements?.[j];
          if (!ruleElement) continue;

          if ('steps' in ruleElement && !('exampleGroups' in ruleElement)) {
            // It's a scenario in rule
            if (hasMatchingTags(ruleElement.tags)) {
              results.push({
                feature: this.feature,
                rule,
                scenario: ruleElement,
                path: `elements[${i}].elements[${j}]`
              });
            }
          } else if ('exampleGroups' in ruleElement) {
            // It's a scenario outline in rule
            if (hasMatchingTags(ruleElement.tags)) {
              results.push({
                feature: this.feature,
                rule,
                scenarioOutline: ruleElement,
                path: `elements[${i}].elements[${j}]`
              });
            }

            // Check example groups
            for (let k = 0; k < ruleElement.exampleGroups.length; k++) {
              const exampleGroup = ruleElement.exampleGroups[k];
              if (exampleGroup && hasMatchingTags(exampleGroup.tags)) {
                results.push({
                  feature: this.feature,
                  rule,
                  scenarioOutline: ruleElement,
                  exampleGroup,
                  path: `elements[${i}].elements[${j}].exampleGroups[${k}]`
                });
              }
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * Find steps by keyword and/or text
   */
  findSteps(options: {
    keyword?: string;
    text?: string;
    queryOptions?: QueryOptions;
  } = {}): QueryResult[] {
    const results: QueryResult[] = [];
    const { keyword, text, queryOptions = {} } = options;
    const { caseSensitive = false, exactMatch = false } = queryOptions;

    const matchText = (target: string, search: string | undefined) => {
      if (search === undefined || search === null) return true; // If search is undefined, match everything
      const normalizedTarget = caseSensitive ? target : target.toLowerCase();
      const normalizedSearch = caseSensitive ? search : search.toLowerCase();
      return exactMatch ? normalizedTarget === normalizedSearch : normalizedTarget.includes(normalizedSearch);
    };

    const searchInSteps = (steps: SimpleStep[], basePath: string, rule?: SimpleRule, scenario?: SimpleScenario, scenarioOutline?: SimpleScenarioOutline) => {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (!step) continue;

        const keywordMatch = !keyword || matchText(step.keyword, keyword);
        const textMatch = !text || matchText(step.text, text);

        if (keywordMatch && textMatch) {
          const result: QueryResult = {
            feature: this.feature,
            step,
            path: `${basePath}.steps[${i}]`
          };
          
          if (rule) {
            result.rule = rule;
          }
          if (scenario) {
            result.scenario = scenario;
          }
          if (scenarioOutline) {
            result.scenarioOutline = scenarioOutline;
          }
          
          results.push(result);
        }
      }
    };

    // Check background steps
    if (this.feature.background) {
      searchInSteps(this.feature.background.steps, 'background', undefined, this.feature.background);
    }

    // Check elements
    for (let i = 0; i < (this.feature.elements || []).length; i++) {
      const element = this.feature.elements?.[i];
      if (!element) continue;

      // Type guard for scenario
      if ('steps' in element && !('exampleGroups' in element) && !('elements' in element)) {
        searchInSteps(element.steps, `elements[${i}]`, undefined, element);
      }
      // Type guard for scenario outline
      else if ('exampleGroups' in element && !('elements' in element)) {
        searchInSteps(element.steps, `elements[${i}]`, undefined, undefined, element);
      }
      // Type guard for rule
      else if ('elements' in element && Array.isArray(element.elements)) {
        const rule = element as SimpleRule;

        // Check rule background steps
        if (rule.background) {
          searchInSteps(rule.background.steps, `elements[${i}].background`, rule, rule.background);
        }

        // Check rule elements
        for (let j = 0; j < (rule.elements || []).length; j++) {
          const ruleElement = rule.elements?.[j];
          if (!ruleElement) continue;

          if ('steps' in ruleElement && !('exampleGroups' in ruleElement)) {
            // It's a scenario in rule
            searchInSteps(ruleElement.steps, `elements[${i}].elements[${j}]`, rule, ruleElement);
          } else if ('exampleGroups' in ruleElement) {
            // It's a scenario outline in rule
            searchInSteps(ruleElement.steps, `elements[${i}].elements[${j}]`, rule, undefined, ruleElement);
          }
        }
      }
    }

    return results;
  }

  /**
   * Get all rules in the feature
   */
  getAllRules(): SimpleRule[] {
    return this._getAllRules();
  }

  /**
   * Get all scenarios across the feature (including those in rules)
   */
  getAllScenarios(): SimpleScenario[] {
    return this._getAllScenarios();
  }

  /**
   * Get all scenario outlines across the feature (including those in rules)
   */
  getAllScenarioOutlines(): SimpleScenarioOutline[] {
    return this._getAllScenarioOutlines();
  }

  private searchInScenario(scenario: SimpleScenario, id: string, basePath: string): QueryResult | null {
    if (scenario.id === id) {
      return {
        feature: this.feature,
        scenario,
        path: basePath
      };
    }

    // Check steps
    for (let i = 0; i < scenario.steps.length; i++) {
      const step = scenario.steps[i];
      if (step && step.id === id) {
        return {
          feature: this.feature,
          scenario,
          step,
          path: `${basePath}.steps[${i}]`
        };
      }
    }

    return null;
  }

  private searchInScenarioOutline(scenarioOutline: SimpleScenarioOutline, id: string, basePath: string): QueryResult | null {
    if (scenarioOutline.id === id) {
      return {
        feature: this.feature,
        scenarioOutline,
        path: basePath
      };
    }

    // Check steps
    for (let i = 0; i < scenarioOutline.steps.length; i++) {
      const step = scenarioOutline.steps[i];
      if (step && step.id === id) {
        return {
          feature: this.feature,
          scenarioOutline,
          step,
          path: `${basePath}.steps[${i}]`
        };
      }
    }

    // Check example groups
    for (let i = 0; i < scenarioOutline.exampleGroups.length; i++) {
      const exampleGroup = scenarioOutline.exampleGroups[i];
      if (exampleGroup && exampleGroup.id === id) {
        return {
          feature: this.feature,
          scenarioOutline,
          exampleGroup,
          path: `${basePath}.exampleGroups[${i}]`
        };
      }
    }

    // Check compiled scenarios
    for (let i = 0; i < scenarioOutline.compiledScenarios.length; i++) {
      const compiledScenario = scenarioOutline.compiledScenarios[i];
      if (compiledScenario && compiledScenario.id === id) {
        return {
          feature: this.feature,
          scenarioOutline,
          scenario: compiledScenario,
          path: `${basePath}.compiledScenarios[${i}]`
        };
      }

      // Check compiled scenario steps
      if (compiledScenario) {
        for (let j = 0; j < compiledScenario.steps.length; j++) {
          const step = compiledScenario.steps[j];
          if (step && step.id === id) {
            return {
              feature: this.feature,
              scenarioOutline,
              scenario: compiledScenario,
              step,
              path: `${basePath}.compiledScenarios[${i}].steps[${j}]`
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Get all feature elements in order (scenarios, scenario outlines, rules)
   * This preserves the original order from the feature file
   */
  getAllElements(): Array<{
    element: SimpleScenario | SimpleScenarioOutline | SimpleRule, 
    type: 'scenario' | 'scenario_outline' | 'rule', 
    index: number
  }> {
    return this.feature.elements?.map((element, index) => {
      if ('steps' in element && 'exampleGroups' in element) {
        return { element, type: 'scenario_outline' as const, index };
      } else if ('steps' in element) {
        return { element, type: 'scenario' as const, index };
      } else {
        return { element, type: 'rule' as const, index };
      }
    }) || [];
  }

  /**
   * Get elements from a rule in order
   */
  getRuleElements(rule: SimpleRule): Array<{
    element: SimpleScenario | SimpleScenarioOutline, 
    type: 'scenario' | 'scenario_outline', 
    index: number
  }> {
    return rule.elements?.map((element, index) => {
      if ('exampleGroups' in element) {
        return { element, type: 'scenario_outline' as const, index };
      } else {
        return { element, type: 'scenario' as const, index };
      }
    }) || [];
  }
}

/**
 * Convenience function to create a QueryEngine instance
 */
export function createQueryEngine(feature: SimpleFeature): QueryEngine {
  return new QueryEngine(feature);
}
