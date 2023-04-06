export abstract class Hook {
  abstract readonly name: string;
  abstract readonly description?: string;
  abstract readonly action: (...args: unknown[]) => void | Promise<void>;
}
