import { Feature } from "@autometa/cucumber";

Feature(({ Scenario }) => {
  Scenario('Something Simple Can Happen', ({ Given, When, Then, And, But }) => {
    afterAll(()=>{
      expect.assertions(5)
    })
    
    Given('a given step', () => {
      console.log('dog')
      expect(1).toBe(1);
    });

    When('a when step', () => {
      console.log('dog')

      expect(1).toBe(1);
    });

    Then('a then step', () => {
      console.log('dog')

      expect(1).toBe(1);
    });

    And('a and step', () => {
      expect(1).toBe(1);
    });

    But('a but step', () => {
      expect(1).toBe(1);
    });
  });
}, 'basic-scenario.feature');
