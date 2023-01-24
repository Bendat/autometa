import Bag from './bag';

describe('bag', () => {
  it('should add an item to the bag', async () => {
    const testFn = jest.fn();
    const bag = new Bag(testFn);
    bag.forEach((it) => it(() => console.log('called')));
    expect(testFn).toBeCalledTimes(1);
  });
});
