export class InjectionToken {
  constructor(public readonly name: string) {}
}
const tokenMap = new Map<string, InjectionToken>();

export function Token(name: string): InjectionToken {
  if (!tokenMap.has(name)) {
    const token = new InjectionToken(name);
    tokenMap.set(name, token);
  }

  return tokenMap.get(name) as InjectionToken;
}

export const DisposeMethod = Symbol("DisposeMethod");
export const DisposeGlobalMethod = Symbol("DisposeGlobalMethod");

export function DisposeTagFilter(tagFilter: string) {
  return function (
    _: {
      [DisposeMethod](
        tags: string[],
        isTagsMatch: (filter: string) => boolean
      ): unknown;
    },
    __: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;
    descriptor.value = function (
      tags: string[],
      isTagMatch: (tags: string[], filter: string) => boolean
    ) {
      if (isTagMatch(tags, tagFilter)) {
        return original.apply(this);
      }
    };
  };
}
