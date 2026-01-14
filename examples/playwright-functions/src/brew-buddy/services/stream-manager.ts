import type { BrewBuddyWorldBase } from "../../world";
import type { SseSession } from "../../utils/sse";

export class BrewBuddyStreamManager {
  readonly world!: BrewBuddyWorldBase;
  private _session: SseSession | undefined;
  private _warnings: string[] = [];
  private _errors: string[] = [];

  attach(session: SseSession): void {
    this.dispose();
    this._session = session;
  }

  current(): SseSession | undefined {
    return this._session;
  }

  dispose(): void {
    const stream = this._session;
    if (stream) {
      stream.close();
      this._session = undefined;
    }
  }

  recordWarning(message: string): void {
    this._warnings.push(message);
  }

  recordError(message: string): void {
    this._errors.push(message);
  }

  warnings(): readonly string[] {
    return this._warnings;
  }

  errors(): readonly string[] {
    return this._errors;
  }

  private ensureWorld(): BrewBuddyWorldBase {
    const world = this.world;
    if (!world) {
      throw new Error("Stream manager world is not set");
    }
    return world;
  }
}
