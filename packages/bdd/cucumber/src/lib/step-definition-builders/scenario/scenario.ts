import { Global } from '@jest/types';
import { GherkinTestValidationError } from '../../errors/validation-errors';
import {
  GherkinScenario,
  GherkinBackground,
  GherkinStep,
} from '@autometa/shared-utilities';
import {
  findMatchingExpression,
  findMatchingGlobalExpression,
  findMatchingGlobalTargetExpression,
} from '../../step-expressions/expressions';
import TestTrackingEvents from '../../tracking/test-tracker';
import {
  Steps,
  PreparedStepCallback,
  StepData,
  PreparedStepData,
} from '../../types';
import { throwErrorIfNoMatch } from '../../utils';
import Background from '../backgrounds/background';
import { TestGroup } from '../test-group/test-group';
import '../../dependency-injection/default-injected';
import { Injectable } from '@autometa/dependency-injection';
import { Store, World } from '@autometa/store';
import { DependencyContainer, inject } from 'tsyringe';
import TestTrackingSubscribers from '../../tracking/test-subscribers';
@Injectable()
export class Scenario extends TestGroup {
  #parsedScenario: GherkinScenario;
  #backgrounds: Background[] = [];
  #parsedBackgrounds: GherkinBackground[];
  #events: TestTrackingEvents;
  #store: { Store: Store; World: World };
  #container: DependencyContainer;
  constructor(@inject('Container') container: DependencyContainer) {
    super();
    container.register(TestTrackingSubscribers, TestTrackingSubscribers);
    this.#events = container.resolve(TestTrackingEvents);
    this.#store = {
      World: container.resolve(World),
      Store: container.resolve(Store),
    };
    this.#container = container;
  }

  get Store() {
    return this.#store;
  }
  
  configure(
    title: string,
    parsedScenario: GherkinScenario,
    backgrounds: Background[],
    parsedBackgrounds: GherkinBackground[]
  ) {
    this._title = title;
    this.#parsedScenario = parsedScenario;
    this.#backgrounds = backgrounds;
    this.#parsedBackgrounds = parsedBackgrounds;
    return this;
  }

  execute(testFunction: Global.It, isSkipped = false): void | Promise<void> {
    const scenario = this.#parsedScenario;
    this.#loadBackgroundSteps();

    const fn = isSkipped || this._isPending ? testFunction.skip : testFunction;
    return fn(
      'Scenario: ' + scenario.title ?? 'Untitled Scenario',
      async () => {
        this.#events.scenarioStarted(this._title);
        try {
          await this.#runBackgroundSteps();
          await this.#runScenarioSteps();
        } finally {
          this.#events.scenarioEnded();
        }
      }
    );
  }

  loadDefinedSteps(...callbacks: Steps[]) {
    const { Given, When, Then, And, But, Shared } = this;
    const params = { Given, When, Then, And, But, Shared };
    callbacks.forEach((callback) => {
      callback(params, this.Store);
    });
  }

  protected _findMatch = (
    regex: RegExp,
    group: string,
    callback: PreparedStepCallback
  ) => {
    const backgroundMatch = this.#checkBackgrounds(regex, group, callback);
    if (backgroundMatch) {
      return backgroundMatch;
    }
    return this.#stepsMatch(regex, group, callback);
  };

  #loadBackgroundSteps() {
    const bgs = this.#backgrounds;
    for (const bg of bgs) {
      this.loadDefinedSteps(bg.stepCallbacks);
    }
  }

  #checkBackgrounds(
    regex: RegExp,
    group: string,
    callback: PreparedStepCallback
  ) {
    const bg = this.#parsedBackgrounds;
    for (const { steps } of bg) {
      for (const parsedStep in steps) {
        const { text, keyword } = steps[parsedStep];
        if (keyword !== group) {
          continue;
        }
        if (regex.test(text)) {
          return new StepData(text, regex, callback, false);
        }
      }
    }
  }

  #stepsMatch(regex: RegExp, group: string, callback: PreparedStepCallback) {
    for (const { text, keyword } of this.#parsedScenario.steps) {
      if (regex.test(text)) {
        if (keyword !== group) {
          continue;
        }
        return new StepData(text, regex, callback, false);
      }
    }
  }

  async #runBackgroundSteps() {
    for (const { steps } of this.#parsedBackgrounds) {
      for (const parsedStep in steps) {
        await this.#runStep(steps[parsedStep]);
      }
    }
  }

  async #runScenarioSteps() {
    for (const step of this.#parsedScenario.steps) {
      await this.#runStep(step);
    }
  }

  async #runStep(step: GherkinStep): Promise<void> {
    const { keyword, text, variables } = step;
    console.log(step.text);
    let matchingStep = this._steps[keyword][text];

    let actualVars: unknown[] = [...variables];

    ({ matchingStep, actualVars } = this.#tryMatchExpression(
      matchingStep,
      keyword,
      text,
      actualVars
    ));

    if (!matchingStep) {
      throw new Error(
        `Could not find matching step definition for ${step.tosString()}`
      );
    }
    if (matchingStep.isGlobal) {
      actualVars.push(this.Store);
    }
    this.#events.stepStarted(keyword, text, variables);
    try {
      await this.#executeStepCallback(matchingStep, actualVars, step);
    } finally {
      this.#events.stepEnded();
    }
  }

  #tryMatchExpression(
    matchingStep: StepData,
    keyword: string,
    text: string,
    actualVars: unknown[]
  ) {
    if (!matchingStep) {
      const group = this._steps[keyword];
      const matchingExpression = findMatchingExpression(text, group);
      const globalMatch =
        findMatchingGlobalExpression(text) ??
        findMatchingGlobalTargetExpression(text, this.#container);
      if (!matchingExpression && !globalMatch) {
        throw new GherkinTestValidationError(
          `Could not find a matching step definition implementation for '${keyword} ${text}'`
        );
      }
      if (matchingExpression) {
        actualVars = [...matchingExpression.args];
        matchingStep = group[matchingExpression.expression];
        return { matchingStep, actualVars };
      } else {
        return { matchingStep: globalMatch.step, actualVars: globalMatch.args };
      }
    }
    return { matchingStep, actualVars };
  }

  async #executeStepCallback(
    matchingStep: PreparedStepData,
    variables: unknown[],
    { text, keyword, table }: GherkinStep
  ) {
    const { regex } = matchingStep;
    let args = [...variables];

    if (regex && variables.length === 0) {
      const [_, matchedVariables] = text.match(regex) ?? [];
      args = [...args, matchedVariables];
    }

    throwErrorIfNoMatch(matchingStep, keyword, text);
    const { action } = matchingStep;
    await action(...args, table);
  }
}
