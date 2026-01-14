import type { ReadableStreamDefaultReader } from "node:stream/web";
import { setTimeout as delay } from "node:timers/promises";

export interface SseEventMessage {
  readonly event: string;
  readonly data: unknown;
  readonly raw: string;
}

export interface SseSession {
  readonly url: string;
  readonly events: readonly SseEventMessage[];
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  waitForEvent(predicate: (message: SseEventMessage) => boolean, timeoutMs?: number): Promise<SseEventMessage>;
  waitForCount(count: number, timeoutMs?: number): Promise<readonly SseEventMessage[]>;
  close(): void;
  appendWarning(message: string): void;
  appendError(message: string): void;
}

interface Waiter {
  readonly predicate: (message: SseEventMessage) => boolean;
  readonly resolve: (message: SseEventMessage) => void;
  readonly reject: (error: Error) => void;
  readonly timer: NodeJS.Timeout;
}

const DEFAULT_TIMEOUT = 5000;

export async function connectSse(url: string): Promise<SseSession> {
  const controller = new AbortController();
  const response = await fetch(url, {
    signal: controller.signal,
    headers: {
      accept: "text/event-stream",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to connect to SSE stream ${url}: ${response.status} ${response.statusText}`);
  }

  const body = response.body;
  if (!body) {
    throw new Error(`Response for SSE stream ${url} does not expose a readable body.`);
  }

  const session = new SseSessionImpl(url, controller);
  session.start(body.getReader()).catch((error: unknown) => {
    if (isAbortError(error)) {
      return;
    }
    session.appendError(error instanceof Error ? error.message : String(error));
  });
  return session;
}

class SseSessionImpl implements SseSession {
  private readonly controller: AbortController;
  private readonly collectedEvents: SseEventMessage[] = [];
  private readonly collectedErrors: string[] = [];
  private readonly collectedWarnings: string[] = [];
  private readonly waiters: Waiter[] = [];
  private closed = false;
  private draining?: Promise<void>;

  constructor(public readonly url: string, controller: AbortController) {
    this.controller = controller;
  }

  get events(): readonly SseEventMessage[] {
    return this.collectedEvents;
  }

  get errors(): readonly string[] {
    return this.collectedErrors;
  }

  get warnings(): readonly string[] {
    return this.collectedWarnings;
  }

  async start(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
    const decoder = new TextDecoder();
    let buffer = "";

    const processChunk = (chunk: string) => {
      buffer += chunk;
      for (;;) {
        const boundary = buffer.indexOf("\n\n");
        if (boundary === -1) {
          break;
        }
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        this.handleEvent(rawEvent);
      }
    };

    this.draining = (async () => {
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) {
            if (!this.closed) {
              this.appendError("CONNECTION_LOST");
            }
            break;
          }
          if (value) {
            processChunk(decoder.decode(value, { stream: true }));
          }
        }
      } finally {
        reader.releaseLock();
      }
    })();

    await this.draining;
  }

  waitForEvent(predicate: (message: SseEventMessage) => boolean, timeoutMs = DEFAULT_TIMEOUT): Promise<SseEventMessage> {
    for (const event of this.collectedEvents) {
      if (predicate(event)) {
        return Promise.resolve(event);
      }
    }

    return new Promise<SseEventMessage>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeWaiter(waiter);
        reject(new Error(`Timed out waiting for SSE event from ${this.url}`));
      }, timeoutMs);
      const waiter: Waiter = {
        predicate,
        resolve: (message) => {
          clearTimeout(timer);
          this.removeWaiter(waiter);
          resolve(message);
        },
        reject: (error) => {
          clearTimeout(timer);
          this.removeWaiter(waiter);
          reject(error);
        },
        timer,
      };
      this.waiters.push(waiter);
    });
  }

  async waitForCount(count: number, timeoutMs = DEFAULT_TIMEOUT): Promise<readonly SseEventMessage[]> {
    if (this.collectedEvents.length >= count) {
      return this.collectedEvents.slice(0, count);
    }

    const deadline = Date.now() + timeoutMs;
    while (this.collectedEvents.length < count && Date.now() < deadline) {
      await delay(50);
    }

    if (this.collectedEvents.length < count) {
      throw new Error(`Timed out waiting for ${count} SSE events from ${this.url}`);
    }

    return this.collectedEvents.slice(0, count);
  }

  close(): void {
    if (!this.closed) {
      this.closed = true;
      this.controller.abort();
    }
  }

  appendWarning(message: string): void {
    this.collectedWarnings.push(message);
  }

  appendError(message: string): void {
    this.collectedErrors.push(message);
    for (const waiter of [...this.waiters]) {
      waiter.reject(new Error(message));
    }
    this.waiters.length = 0;
  }

  private removeWaiter(waiter: Waiter): void {
    const index = this.waiters.indexOf(waiter);
    if (index !== -1) {
      this.waiters.splice(index, 1);
    }
  }

  private handleEvent(rawEvent: string): void {
    const lines = rawEvent.split(/\r?\n/);
    let eventName = "message";
    const dataLines: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith(":")) {
        continue;
      }
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim() || eventName;
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    const dataText = dataLines.join("\n");
    const message: SseEventMessage = {
      event: eventName,
      data: parseDataPayload(dataText),
      raw: dataText,
    };

    this.collectedEvents.push(message);

    for (const waiter of [...this.waiters]) {
      if (waiter.predicate(message)) {
        waiter.resolve(message);
      }
    }
  }
}

function parseDataPayload(payload: string): unknown {
  const trimmed = payload.trim();
  if (!trimmed) {
    return {};
  }
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const candidate = error as { name?: string };
  return candidate.name === "AbortError";
}
