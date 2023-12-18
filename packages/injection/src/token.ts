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
