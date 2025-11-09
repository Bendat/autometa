export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

export function cloneDate(date: Date): Date {
  return new Date(date.getTime());
}
