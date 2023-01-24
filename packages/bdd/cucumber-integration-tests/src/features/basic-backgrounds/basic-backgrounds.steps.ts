import { Feature } from '@autometa/cucumber';

Feature(({ Background, Scenario }) => {
  afterAll(() => {
    expect.assertions(4);
  });

  Background('A Named Background', ({ Given }) => {
    Given('a holly', () => {
      expect(1).toBe(1);
    });

    Given('a jolly', () => {
      expect(1).toBe(1);
    });
  });

  Scenario('Cheers', ({ When, Then }) => {
    When('a Christmas', () => {
      expect(1).toBe(1);
    });

    Then('everybody gives a cheer', () => {
      expect(1).toBe(1);
    });
  });
}, './basic-backgrounds.feature');
