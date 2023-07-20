import {
  Background,
  Examples,
  Feature,
  GherkinNode,
  Rule,
  Scenario,
  ScenarioOutline,
  Step,
} from "@autometa/gherkin";
import { AutomationError } from "@autometa/errors";

export type WalkFunction<T extends GherkinNode, TAccumulator, TReturn> = (
  node: T,
  accumulator: TAccumulator,
  lastNode?: GherkinNode
) => TReturn;

export type WalkFunctionMap<TAccumulator> = {
  onFeature?: WalkFunction<Feature, TAccumulator, TAccumulator>;
  onRule?: WalkFunction<Rule, TAccumulator, TAccumulator>;
  onBackground?: WalkFunction<Background, TAccumulator, TAccumulator>;
  onScenario?: WalkFunction<Scenario, TAccumulator, TAccumulator>;
  onScenarioOutline?: WalkFunction<ScenarioOutline, TAccumulator, TAccumulator>;
  onExamples?: WalkFunction<Examples, TAccumulator, TAccumulator>;
  onStep?: WalkFunction<Step, TAccumulator, TAccumulator>;
};

export class GherkinWalker {
  static walk<TAccumulator>(
    walkFunction: WalkFunctionMap<TAccumulator>,
    childNode: GherkinNode,
    accumulator: TAccumulator,
    parentNode?: GherkinNode
  ) {
    if (accumulator === undefined) {
      throw new AutomationError(
        `An accumulator must be defined to continue the walker from ${
          childNode.constructor.name
        }${JSON.stringify(childNode)}`
      );
    }
    this.#walkNode(childNode, accumulator, walkFunction, parentNode);
    return accumulator;
  }

  static #walkNode<TAccumulator>(
    child: GherkinNode,
    accumulator: TAccumulator,
    walkFunction: WalkFunctionMap<TAccumulator>,
    lastNode?: GherkinNode
  ) {
    if (child instanceof Feature && walkFunction.onFeature) {
      const acc = walkFunction.onFeature(child, accumulator, lastNode);
      return this.#walkChildren(child, acc, walkFunction);
    }

    if (child instanceof Rule && walkFunction.onRule) {
      const acc = walkFunction.onRule(child, accumulator, lastNode);
      return this.#walkChildren(child, acc, walkFunction);
    }

    if (child instanceof Examples) {
      const acc = walkFunction.onExamples?.(child, accumulator, lastNode);
      return this.#walkChildren(child, acc, walkFunction);
    }

    if (child instanceof Scenario && !(child instanceof Examples)) {
      walkFunction.onScenario?.(child, accumulator, lastNode);
      return this.#walkChildren(child, accumulator, walkFunction);
    }

    if (child instanceof ScenarioOutline) {
      const acc = walkFunction.onScenarioOutline?.(child, accumulator, lastNode);
      return this.#walkChildren(child, acc, walkFunction);
    }

    if (child instanceof Background) {
      const acc = walkFunction?.onBackground?.(child, accumulator, lastNode);
      return this.#walkChildren(child, acc, walkFunction);
    }

    if (child instanceof Step) {
      const acc = walkFunction.onStep?.(child, accumulator, lastNode);
      return this.#walkChildren(child, acc, walkFunction);
    }
  }

  static #walkChildren<TAccumulator>(
    child: GherkinNode,
    accumulator: TAccumulator,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    walkFunction: WalkFunctionMap<any>
  ) {
    for (const node of child.children) {
      this.walk(walkFunction, node, accumulator, child);
    }
  }
}
