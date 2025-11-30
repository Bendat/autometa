export interface TagRegistryEntry {
  readonly tag: string;
  readonly description: string;
}

export class TagRegistryService {
  registry: TagRegistryEntry[] = [];
  expression = "";
  selectedScenarios: string[] = [];

  setRegistry(registry: TagRegistryEntry[]) {
    this.registry = registry;
  }

  setExpression(expression: string) {
    this.expression = expression;
  }

  setSelectedScenarios(scenarios: string[]) {
    this.selectedScenarios = scenarios;
  }

  clearSelection() {
    this.selectedScenarios = [];
  }
}
