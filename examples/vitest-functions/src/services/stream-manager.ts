import type { BrewBuddyWorldBase } from "../world";
import type { SseSession } from "../utils/sse";

export class BrewBuddyStreamManager {
  declare readonly world: BrewBuddyWorldBase;
  #session: SseSession | undefined;

  attach(session: SseSession): void {
    this.dispose();
    this.#session = session;
  }

  current(): SseSession | undefined {
    return this.#session;
  }

  dispose(): void {
    const stream = this.#session;
    if (stream) {
      stream.close();
      this.#session = undefined;
    }
  }

  recordWarning(message: string): void {
    this.ensureWorld().scenario.streamWarnings.push(message);
  }

  recordError(message: string): void {
    this.ensureWorld().scenario.streamErrors.push(message);
  }

  warnings(): readonly string[] {
    return this.ensureWorld().scenario.streamWarnings;
  }

  errors(): readonly string[] {
    return this.ensureWorld().scenario.streamErrors;
  }

  private ensureWorld(): BrewBuddyWorldBase {
    const world = this.world;
    if (!world) {
      throw new Error("Stream manager world is not set");
    }
    return world;
  }
}
