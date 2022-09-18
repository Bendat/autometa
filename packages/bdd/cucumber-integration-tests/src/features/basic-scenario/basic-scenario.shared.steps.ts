import { Feature } from "@autometa/cucumber";

const mainCallbacks = ({ Given, When, Then }) => {
  Given('a {word} step', (keyword) => {
    console.log('cat');

    expect(keyword).toBe('given');
  });

  When('a {word} step', (keyword) => {
    console.log('cat');

    expect(keyword).toBe('when');
  });

  Then('a {word} step', (keyword) => {
    console.log('cat');

    expect(keyword).toBe('then');
  });
};

const additionalCallbacks = ({ And, But }) => {
  And('a {word} step', (keyword) => {
    console.log('cat');

    expect(keyword).toBe('and');
  });

  But('a {word} step', (keyword) => {
    console.log('cat');

    expect(keyword).toBe('but');
  });
};

Feature(({ Scenario }) => {
  Scenario('Something Simple Can Happen', ({ Shared }) => {
    beforeAll(() => {
      expect.assertions(5);
    });
    Shared(mainCallbacks, additionalCallbacks);
  });
}, './basic-scenario.feature');
