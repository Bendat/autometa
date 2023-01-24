import { endGroup, startGroup } from '@autometa/logging';
import { injectable } from 'tsyringe';
import Bag from './bag';

enum ConsoleGroupToken {
  Feature = 'Feature',
  Scenario = 'Scenario',
  ScenarioOutline = 'Scenario Outline',
  Rule = 'Rule',
  Step = '',
}

@injectable()
export default class TestTrackingSubscribers {
  readonly featureStarted = new Bag((title: string) =>
    startGroup(ConsoleGroupToken.Feature, title)
  );
  readonly ruleStarted = new Bag((title: string) =>
    startGroup(ConsoleGroupToken.Rule, title)
  );

  readonly featureEnded = new Bag(() => endGroup(ConsoleGroupToken.Feature));
  readonly ruleEnded = new Bag(() => endGroup(ConsoleGroupToken.Rule));
  readonly scenarioOutlineStarted = new Bag((title: string) =>
    startGroup(ConsoleGroupToken.ScenarioOutline, title)
  );
  readonly scenarioOutlineEnded = new Bag(() =>
    endGroup(ConsoleGroupToken.ScenarioOutline)
  );
  readonly scenarioStarted = new Bag((title: string) =>
    startGroup(ConsoleGroupToken.Scenario, title)
  );
  readonly scenarioEnded = new Bag(() => endGroup(ConsoleGroupToken.Scenario));
  readonly stepStarted = new Bag(
    (keyword: string, sentence: string, ..._: unknown[]) =>
      startGroup(ConsoleGroupToken.Step, keyword, sentence)
  );
  readonly stepEnded = new Bag(() => endGroup(ConsoleGroupToken.Step));
}
