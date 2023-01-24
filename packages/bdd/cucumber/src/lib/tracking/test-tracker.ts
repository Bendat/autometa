import { Injectable } from '@autometa/dependency-injection';
import Bag from './bag';
import TestTrackingSubscribers from './test-subscribers';

@Injectable()
export default class TestTrackingEvents {
  #subscribers: TestTrackingSubscribers;
  constructor(subscribers: TestTrackingSubscribers) {
    this.#subscribers = subscribers;
  }
  featureStarted = (title: string) =>
    alertSubscribers(this.#subscribers.featureStarted, title);

  featureEnded = () => alertSubscribers(this.#subscribers.featureEnded);

  ruleStarted = (title: string) =>
    alertSubscribers(this.#subscribers.ruleStarted, title);

  ruleEnded = () => alertSubscribers(this.#subscribers.ruleEnded);

  scenarioOutlineStarted = (title: string | undefined) =>
    alertSubscribers(this.#subscribers.scenarioOutlineStarted, title);

  scenarioOutlineEnded = () =>
    alertSubscribers(this.#subscribers.scenarioOutlineEnded);

  scenarioStarted = (title: string | undefined) =>
    alertSubscribers(this.#subscribers.scenarioStarted, title);

  scenarioEnded = () => alertSubscribers(this.#subscribers.scenarioEnded);

  stepStarted = (keyword: string, sentence: string, ..._: unknown[]) =>
    alertSubscribers(this.#subscribers.stepStarted, keyword, sentence);

  stepEnded = () => alertSubscribers(this.#subscribers.stepEnded);
}

function alertSubscribers(subscribers: Bag, ...args: unknown[]) {
  subscribers.forEach((it) => it(...args));
}
