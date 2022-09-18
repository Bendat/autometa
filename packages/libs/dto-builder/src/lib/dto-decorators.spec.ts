import { Property, getDtoPropertyDecorators } from './dto-decorators';
class TestClass {
  @Property
  foo!: string;

  @Property
  bar!: string;
}
describe('Property', () => {
  it('should attach all property names as metadata', () => {
    const c = new TestClass();
    const meta = getDtoPropertyDecorators(c);
    expect([...meta]).toEqual(['foo', 'bar']);
  });
});
