import { expectTypeOf, test } from 'vitest'
import { FromLiteral } from './confirmations';

test('should extract a literal value from an object', ()=>{
    const obj = {
        foo: 'bar',
        bar: 'baz',
        baz: 1,
    } 
    const result = FromLiteral(obj, 'foo');
    expectTypeOf(result).toEqualTypeOf('bar');
})