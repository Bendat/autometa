import { matchesFilter } from './tag-filtering';

describe('parseTagFilterString', () => {
  it('should match a single tag', () => {
    const filter = '@foo';
    const matches = matchesFilter(filter, ['@foo']);
    expect(matches).toBe(true);
  });
  it('should fail to match a single tag', () => {
    const filter = '@foo';
    const matches = matchesFilter(filter, ['@bar']);
    expect(matches).toBe(false);
  });

  it('should match compound additive tags', () => {
    const filter = '@foo and @bar';
    const matches = matchesFilter(filter, ['@foo', '@bar']);
    expect(matches).toBe(true);
  });
  it('should fail to match compound additive tags', () => {
    const filter = '@foo and @bar';
    const matches = matchesFilter(filter, ['@bar']);
    expect(matches).toBe(false);
  });
  it('should match compound indiscriminate tags', () => {
    const filter = '@foo or @bar';
    const matches = matchesFilter(filter, ['@bar']);
    expect(matches).toBe(true);
  });
  it('should match compound indiscriminate tags', () => {
    const filter = '@foo or @bar';
    const matches = matchesFilter(filter, ['@bar']);
    expect(matches).toBe(true);
  });

  it('should match complex tags chain', () => {
    const filter = '@foo and @bar and @cat or @dog';
    const matches = matchesFilter(filter, ['@foo', '@bar', '@cat']);
    expect(matches).toBe(true);
  });

  it('should fail match complex tags chain', () => {
    const filter = '@foo and @bar and @cat or @dog';
    const matches = matchesFilter(filter, ['@foo', '@bar']);
    expect(matches).toBe(false);
  });
});
