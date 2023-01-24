import { describe } from '@jest/globals';
import { FeatureRun } from './step-definition-builders/feature/feature-run';
import TestTrackingSubscribers from './tracking/test-subscribers';
import TestTrackingEvents from './tracking/test-tracker';
import { FeatureCallback, FeatureCallbackObject } from './types';
import { readFeature } from './utils';
import { getCallerFromIndex } from '@autometa/shared-utilities';
function runFeatureFile(featureCallback: FeatureCallback, featurePath: string) {
  const parsedGherkin = getFeature(featurePath);
  const tracker = new TestTrackingEvents(new TestTrackingSubscribers());
  tracker.featureStarted(parsedGherkin.feature.title);

  const feature = new FeatureRun(parsedGherkin, tracker);
  const callbackObject: FeatureCallbackObject = {
    Scenario: feature.getScenarioCallback,
    ScenarioOutline: feature.getOutlineCallback,
    Background: feature.getBackgroundCallback,
    All: feature.getTopLevelRunCallback,
    Rule: feature.getRuleCallback,
  };
  featureCallback(callbackObject);
  feature.execute(describe);
}

function getFeature(file: string) {
  return readFeature(file, getCallerFromIndex(3));
}

/**
 * Entrypoint function for @autometa.
 *
 * Takes a callback which provides Scenarios, ScenarioOutlines,
 * Backgrounds and other options to build out the step code for gherkin
 * feature files.
 *
 * Example:
 * Feature(({ Scenario }) => {
 *  Scenario(({Given, When }) => {
 *    Given('something', () => {
 *     ...
 *    });
 *  });
 * });
 * ```
 * @param featureCallback The actions to take to test your feature file
 * @param featurePath The path to the feature file. Can be relative to the test file, absolute, or derived from the root of the running project with `~/`
 */
export const Feature = runFeatureFile;
