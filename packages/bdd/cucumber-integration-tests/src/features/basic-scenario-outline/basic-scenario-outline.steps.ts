import { Feature } from '@autometa/cucumber';

Feature(({ ScenarioOutline }) => {
  const counts = [1, 2];
  const animalNames = ['dogs', 'cats'];
  ScenarioOutline('An Outline Is a Thing', ({ Given }) => {
    Given('{int} {word}', (numberOf: string, animals: string) => {
      expect(numberOf).toBe(counts.shift());
      expect(animals).toBe(animalNames.shift());
    });
  });
}, './basic-scenario-outline.feature');
