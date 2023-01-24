import { Feature } from '@autometa/cucumber';

Feature(({ Rule }) => {
  afterAll(() => {
    expect.assertions(3);
  });
  Rule('No Dancing In The Halls', ({ Scenario }) => {
    Scenario('Attempting to Dance in Hall Fails', ({ Given, When, Then }) => {
      Given('me, dancing', () => {
        expect(1).toBe(1);
      });

      When('I enter the hall', () => {
        expect(1).toBe(1);
      });

      Then('I am blown up', () => {
        expect(1).toBe(1);
      });
    });
  });
}, './basic-rule.feature');
