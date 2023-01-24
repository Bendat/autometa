import { EMPTY_STRING } from '../..';
import { parseCucumber } from './parser';
const bareFeature = `Feature:`;
const bareFeatureWithName = `Feature: A feature with no scenarios`;
const featureWithBareBackground = `Feature: A feature with a background
  Background:
`;

const featureWithBackground = `Feature: A feature with a background
  Background: A background
    Given an old frog
`;

const featureWithBareScenario = `Feature: A feature with a background
  Scenario:
`;

const featureWithScenario = `Feature: A feature with a scenario
    Scenario: you've got 3 dollars, no clothes, and nothing to lose
        Given you try the slot machines
`;
const featureWithScenarioWithTable = `Feature: A feature with a data table
    Scenario: you've got 3 dollars, no clothes, and nothing to lose
        Given you search a book
        | title              | author |
        | Lorde of The Rings | Lorde  |
`;

const featureWithBareScenarioOutline = `Feature: A feature with a background
  Scenario Outline:
`;

const featureWithScenarioOutline = `Feature: A feature with a scenario
    Scenario Outline: you've got 3 dollars, no clothes, and nothing to lose
        Given you try the slot machines
`;

const featureWithScenarioOutlineWithExample = `Feature: A feature with a scenario
    Scenario Outline: you've got 3 dollars, no clothes, and nothing to lose
        Given a <foo> with <bar>

        Examples:
            | foo | bar |
            | 1   | 2   |
            | a   | b   |

`;

const featureWithScenarioOutlineWithMultipleExamples = `Feature: A feature with a scenario

    Scenario Outline: you've got 3 dollars, no clothes, and nothing to lose
        Given a <foo> with <bar>

        Examples:
            | foo | bar |
            | 1   | 2   |
            | a   | b   |
            
        Examples:
            | foo | bar |
            | aa  | bb  |
`;

const featureWithRuleWithScenario = `Feature: A feature with a rule
  Rule: if a, then b
    Scenario: yabba dabba
      Given you play by the rules
`;

const featureWithRuleWithBackground = `Feature: A feature with a rule with a background
  Rule: if a, then b
    Background: setup
      Given a background
`;

const featureWithBackgroundAndRuleWithBackground = `Feature: A feature with a background, and rule with a background
  Background: setup
    Given a setup step

  Rule: if a, then b
    Background:
      Given a background
`;

describe('parseCucumber', () => {
  describe('feature', () => {
    it('should parse an bare feature', () => {
      const { language, feature } = parseCucumber(bareFeature);
      const { title } = feature;
      expect(language).toBe('en');
      expect(title).toBe('');
    });

    it('should parse an bare feature with a name', () => {
      const { language, feature } = parseCucumber(bareFeatureWithName);
      const { title } = feature;
      expect(language).toBe('en');
      expect(title).toBe('A feature with no scenarios');
    });
  });

  describe('background', () => {
    it('should parse a bare background', () => {
      const { feature } = parseCucumber(featureWithBareBackground);
      const { backgrounds } = feature;
      const [first] = backgrounds;
      const { title } = first;
      expect(title).toBe(EMPTY_STRING);
    });

    it('should parse a background with steps', () => {
      const { feature } = parseCucumber(featureWithBackground);
      const { backgrounds } = feature;
      const [first] = backgrounds;
      const { title: name, steps } = first;
      const [given] = steps;
      const { keyword, text } = given;
      expect(keyword).toBe('Given');
      expect(text).toBe('an old frog');
      expect(name).toBe('A background');
    });
  });
  describe('Scenarios', () => {
    it('should parse a bare scenario', () => {
      const { feature } = parseCucumber(featureWithBareScenario);
      const { scenarios } = feature;
      const [first] = scenarios;
      const { title } = first;
      expect(title).toBe(EMPTY_STRING);
    });

    it('should parse a scenario with steps', () => {
      const { feature } = parseCucumber(featureWithScenario);
      const { scenarios } = feature;
      const [first] = scenarios;
      const { title, steps } = first;
      const [given] = steps;
      const { keyword, text } = given;
      expect(keyword).toBe('Given');
      expect(text).toBe('you try the slot machines');
      expect(title).toBe(
        "you've got 3 dollars, no clothes, and nothing to lose"
      );
    });

    describe('with data table', () => {
      it('should parse a scenario with a data step', () => {
        const { feature } = parseCucumber(featureWithScenarioWithTable);
        const { scenarios } = feature;
        const [first] = scenarios;
        const { steps } = first;
        const [given] = steps;
        const { table } = given;
        const expected = {
          titles: ['title', 'author'],
          rows: [['Lorde of The Rings', 'Lorde']],
        };
        expect(table).toEqual(expected);
      });
    });
  });

  describe('Scenarios outlines', () => {
    it('should parse a bare scenario outline', () => {
      const { feature } = parseCucumber(featureWithBareScenarioOutline);
      const { outlines } = feature;
      const [first] = outlines;
      const { title } = first;
      expect(title).toBe(EMPTY_STRING);
    });

    it('should parse a scenario with steps', () => {
      const { feature } = parseCucumber(featureWithScenarioOutline);
      const { outlines } = feature;
      const [first] = outlines;
      const { title: name, steps } = first;
      const [given] = steps;
      const { keyword, text } = given;
      expect(keyword).toBe('Given');
      expect(text).toBe('you try the slot machines');
      expect(name).toBe(
        "you've got 3 dollars, no clothes, and nothing to lose"
      );
    });

    it('should parse a scenario with examples', () => {
      const { feature } = parseCucumber(featureWithScenarioOutlineWithExample);
      const { outlines } = feature;
      const [first] = outlines;
      const { examples } = first;
      const [example] = examples;
      const expected = {
        headers: ['foo', 'bar'],
        values: [
          ['1', '2'],
          ['a', 'b'],
        ],
      };
      expect(example).toEqual(expected);
    });

    it('should parse a scenario with multiple examples', () => {
      const { feature } = parseCucumber(
        featureWithScenarioOutlineWithMultipleExamples
      );
      const { outlines } = feature;
      const [outline] = outlines;
      const { examples } = outline;
      const [first, second] = examples;
      const expectedFirst = {
        headers: ['foo', 'bar'],
        values: [
          ['1', '2'],
          ['a', 'b'],
        ],
      };
      const expectedSecond = {
        headers: ['foo', 'bar'],
        values: [['aa', 'bb']],
      };
      expect(first).toStrictEqual(expectedFirst);
      expect(second).toStrictEqual(expectedSecond);
    });
  });

  describe('Rules', () => {
    it('should parse rule scenario', () => {
      const { feature } = parseCucumber(featureWithRuleWithScenario);
      const { rules } = feature;
      const [first] = rules;
      const { title: ruleName, scenarios } = first;
      const [scenario] = scenarios;
      const { title, steps } = scenario;
      const [given] = steps;
      const { keyword, text } = given;
      expect(keyword).toBe('Given');
      expect(text).toBe('you play by the rules');
      expect(title).toBe('yabba dabba');
      expect(ruleName).toBe('if a, then b');
    });

    it('should parse rule background', () => {
      const { feature } = parseCucumber(featureWithRuleWithBackground);
      const { rules } = feature;
      const [first] = rules;
      const { title: ruleName, backgrounds } = first;
      const [background] = backgrounds;
      const { title: name, steps } = background;
      const [given] = steps;
      const { keyword, text } = given;
      expect(keyword).toBe('Given');
      expect(text).toBe('a background');
      expect(name).toBe('setup');
      expect(ruleName).toBe('if a, then b');
    });
    it('should parse rule background and feature background', () => {
      const { feature } = parseCucumber(
        featureWithBackgroundAndRuleWithBackground
      );
      const { rules, backgrounds: featureBackgrounds } = feature;
      const [featureBackground] = featureBackgrounds;
      const { title: bgName, steps: bgSteps } = featureBackground;
      const [bgGiven] = bgSteps;
      const [first] = rules;
      const { title: ruleName, backgrounds } = first;
      const [background] = backgrounds;
      const { title: name, steps } = background;
      const [given] = steps;
      const { keyword, text } = given;
      expect(bgName).toBe('setup');
      expect(bgGiven.keyword).toBe('Given');
      expect(bgGiven.text).toBe('a setup step');
      expect(keyword).toBe('Given');
      expect(text).toBe('a background');
      expect(name).toBe('');
      expect(ruleName).toBe('if a, then b');
    });
  });
});
