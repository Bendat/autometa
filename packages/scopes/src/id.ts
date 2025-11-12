let counter = 0;

export function createId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function resetIdCounter(): void {
  counter = 0;
}
