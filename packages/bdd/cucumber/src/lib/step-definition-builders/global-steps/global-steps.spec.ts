import './sample-steps';
import './decorators';
import { globalCache, StepCache } from './global-step-cache';
import { GherkinStep } from '@autometa/shared-utilities';
test('globalCache', () => {
  console.log(JSON.stringify(globalCache, null, 2));
});
describe('global steps', () => {
  describe('findStep', () => {
    it('it finds a step', () => {
      const cache = new StepCache();
      cache.Given.push({
        text: 'my text',
        regex: undefined,
        isGlobal: true,
        action: () => console.log('actioned'),
      });
      const step = cache.findStep(
        'Given',
        new GherkinStep('Given', 'my text', [])
      );
      console.log(step);
    });
    it('it finds a wildcard step', () => {
      const cache = new StepCache();
      cache.Given.push({
        text: 'my text',
        regex: undefined,
        isGlobal: true,
        action: () => console.log('actioned'),
      });
      const step = cache.findStep('Given', new GherkinStep('*', 'my text', []));
      console.log(step);
    });
  });
});
