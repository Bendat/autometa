import { SwitchConjunction } from './switch-conjunction';
interface TestType {
  will();
  see();
  and();
}

describe('Decorating a class to switch a conjunction method based on context', () => {
  const will = jest.fn();
  const see = jest.fn();
  let testObj: TestType;
  beforeEach(() => {
    will.mockReset();
    see.mockReset();
    class Foo {
      @SwitchConjunction()
      will() {
        will();
        return this;
      }
      @SwitchConjunction()
      see() {
        see();
        return this;
      }
      and = null;
    }
    testObj = new Foo();
  });

  it('should bind the conjunction to the "will" method', () => {
    testObj.will().and();
    expect(will).toHaveBeenCalledTimes(2);
  });
  it('should bind the conjunction to the "see" method', () => {
    testObj.see().and();
    expect(see).toHaveBeenCalledTimes(2);
  });

  it('should switch the conjunction context repeatedly', () => {
    testObj.will().and().see().and().will().and();
    expect(will).toHaveBeenCalledTimes(4);
    expect(see).toHaveBeenCalledTimes(2);
  });
});
