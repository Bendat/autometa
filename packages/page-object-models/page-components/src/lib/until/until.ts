import { WebElement } from 'selenium-webdriver';
import {
  elementTextContains,
  elementTextMatches,
  titleMatches,
  elementIsDisabled,
  elementIsEnabled,
  elementIsSelected,
  elementIsNotSelected,
  elementIsVisible,
  elementLocated,
  stalenessOf,
  urlContains,
  elementIsNotVisible,
} from 'selenium-webdriver/lib/until';
import { UntilArgs } from './until-args';
import { UntilCondition } from './until-condition';
import { UntilElement } from './until-element';
import { UntilLocator } from './until-locator';

const hasTextFunction = (text: string) => (element: WebElement) =>
  elementTextContains(element, text);

const matchesTextFunction = (pattern: RegExp) => (element: WebElement) =>
  elementTextMatches(element, pattern);

const matchesPageTitle = (pattern: RegExp) => () => titleMatches(pattern);
export class Until {
  static readonly isDisabled: UntilCondition = new UntilElement(
    elementIsDisabled,
    'isDisabled'
  );

  static readonly isEnabled: UntilCondition = new UntilElement(
    elementIsEnabled,
    'isEnabled'
  );

  static readonly isSelected: UntilCondition = new UntilElement(
    elementIsSelected,
    'isSelected'
  );

  static readonly isNotSelected: UntilCondition = new UntilElement(
    elementIsNotSelected,
    'isNotSelected'
  );

  static readonly isVisible: UntilCondition = new UntilElement(
    elementIsVisible,
    'isVisible'
  );

  static readonly isNotVisible: UntilCondition = new UntilElement(
    elementIsNotVisible,
    'isNotSelected'
  );

  static readonly isLocated: UntilCondition = new UntilLocator(
    elementLocated,
    'isLocated'
  );
  /**
   * ERROR: BUG
   * This should be a function which accepts text
   */
  static readonly containsText: UntilCondition = new UntilElement(
    elementTextContains,
    'containsText'
  );

  static readonly hasText = (text: string) =>
    new UntilElement(hasTextFunction(text), 'hasText') as UntilCondition;

  static readonly matchesText = (pattern: RegExp) =>
    new UntilElement(
      matchesTextFunction(pattern),
      'matchesText'
    ) as UntilCondition;

  static readonly isStale = new UntilElement(stalenessOf, 'isStale');

  static readonly matchesTitle = (pattern: RegExp) =>
    new UntilArgs(matchesPageTitle(pattern), 'matchesTitle');

  static readonly urlContains = (urlSubstring: string) =>
    new UntilArgs(() => urlContains(urlSubstring), 'urlContains');

  static readonly hasUrl = (url: string) =>
    new UntilArgs(() => urlContains(url), 'hasUrl');
}
