import { bddCucumberIntegrationTests } from './bdd-cucumber-integration-tests';

describe('bddCucumberIntegrationTests', () => {
  it('should work', () => {
    expect(bddCucumberIntegrationTests()).toEqual(
      'bdd-cucumber-integration-tests'
    );
  });
});
