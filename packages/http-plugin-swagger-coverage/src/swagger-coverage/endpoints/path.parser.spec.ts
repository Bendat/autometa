import { describe, it, expect } from 'vitest';
import { matchPath } from './path.parser';
describe(`matchPath`, () => {
  it(`should return true when swaggerPaths and desiredPaths are the same`, () => {
    expect(matchPath(['a', 'b'], ['a', 'b'])).toBe(true);
  });
  it(`should return true when swaggerPaths and desiredPaths are the same and have parameters`, () => {
    expect(matchPath(['a', '{b}'], ['a', 'b'])).toBe(true);
  });
  it(`should return false when swaggerPaths and desiredPaths are different`, () => {
    expect(matchPath(['a', 'b'], ['a', 'c'])).toBe(false);
  });
  it(`should return false when swaggerPaths and desiredPaths are different lengths`, () => {
    expect(matchPath(['a', 'b'], ['a'])).toBe(false);
  });
  it(`should return false when swaggerPaths and desiredPaths are different lengths and have parameters`, () => {
    expect(matchPath(['a', '{b}'], ['a'])).toBe(false);
  });
});
