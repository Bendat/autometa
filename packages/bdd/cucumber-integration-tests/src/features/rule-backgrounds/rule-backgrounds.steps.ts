import { Feature } from '@autometa/cucumber';

Feature(({ Background, Rule }) => {
  afterAll(() => {
    expect.assertions(4);
  });

  Background('A Named Background', ({ Given }) => {
    Given('a holly', () => {
      expect(1).toBe(1);
    });
  });

  Rule('I Am A Rule', ({ Background, Scenario }) => {
    Background(({ Given }) => {
      Given('a jolly', () => {
        expect(1).toBe(1);
      });
    });

    Scenario('A Rule Applies', ({ When, Then }) => {
      When('a Christmas', () => {
        expect(1).toBe(1);
      });

      Then('everybody gives a cheer', () => {
        expect(1).toBe(1);
      });
    });
  });
}, './rule-backgrounds.feature');
