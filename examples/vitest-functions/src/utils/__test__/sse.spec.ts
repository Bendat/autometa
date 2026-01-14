import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { connectSse, SseSession } from "../sse";

describe("connectSse", () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should throw an error if fetch fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(connectSse("http://example.com/sse")).rejects.toThrow(
      "Failed to connect to SSE stream http://example.com/sse: 404 Not Found"
    );
  });

  it("should throw an error if response body is missing", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      body: null,
    });

    await expect(connectSse("http://example.com/sse")).rejects.toThrow(
      "Response for SSE stream http://example.com/sse does not expose a readable body."
    );
  });

  it("should return an SseSession on successful connection", async () => {
    const mockReader = {
      read: vi.fn().mockReturnValue(new Promise(() => {
        // Never resolves to keep stream open
      })),
      releaseLock: vi.fn(),
    };
    const mockBody = {
      getReader: vi.fn().mockReturnValue(mockReader),
    };

    fetchMock.mockResolvedValue({
      ok: true,
      body: mockBody,
    });

    const session = await connectSse("http://example.com/sse");
    expect(session).toBeDefined();
    expect(session.url).toBe("http://example.com/sse");
    session.close();
  });
});

describe("SseSessionImpl", () => {
  let fetchMock: Mock;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockReader: any;
  let session: SseSession;
  let pushChunk: (chunk: Uint8Array) => void;

  beforeEach(async () => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queue: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pendingResolve: ((val: any) => void) | null = null;

    mockReader = {
      read: vi.fn().mockImplementation(() => {
        if (queue.length > 0) {
          return Promise.resolve(queue.shift());
        }
        return new Promise((resolve) => {
          pendingResolve = resolve;
        });
      }),
      releaseLock: vi.fn(),
    };

    pushChunk = (chunk: Uint8Array) => {
      const result = { done: false, value: chunk };
      if (pendingResolve) {
        const resolve = pendingResolve;
        pendingResolve = null;
        resolve(result);
      } else {
        queue.push(result);
      }
    };

    const mockBody = {
      getReader: vi.fn().mockReturnValue(mockReader),
    };

    fetchMock.mockResolvedValue({
      ok: true,
      body: mockBody,
    });

    session = await connectSse("http://example.com/sse");
  });

  afterEach(() => {
    session.close();
    vi.restoreAllMocks();
  });

  it("should parse incoming events", async () => {
    const encoder = new TextEncoder();
    const chunk1 = encoder.encode("event: test\ndata: {\"foo\":\"bar\"}\n\n");
    
    pushChunk(chunk1);

    const event = await session.waitForEvent((e) => e.event === "test");

    expect(event).toEqual({
      event: "test",
      data: { foo: "bar" },
      raw: '{"foo":"bar"}',
    });
    expect(session.events).toContain(event);
  });

  it("should handle multiple events in one chunk", async () => {
    const encoder = new TextEncoder();
    const chunk = encoder.encode("data: 1\n\ndata: 2\n\n");
    
    pushChunk(chunk);

    const events = await session.waitForCount(2);
    expect(events).toHaveLength(2);
    expect(events[0]?.data).toBe("1");
    expect(events[1]?.data).toBe("2");
  });

  it("should handle split chunks", async () => {
    const encoder = new TextEncoder();
    const chunk1 = encoder.encode("data: hel");
    const chunk2 = encoder.encode("lo\n\n");
    
    pushChunk(chunk1);
    // Give the loop a chance to process chunk1
    await new Promise(resolve => setTimeout(resolve, 10));
    pushChunk(chunk2);

    const event = await session.waitForEvent(() => true);
    expect(event.data).toBe("hello");
  });

  it("should timeout waitForEvent", async () => {
    await expect(session.waitForEvent(() => false, 100)).rejects.toThrow(
      "Timed out waiting for SSE event from http://example.com/sse"
    );
  });

  it("should timeout waitForCount", async () => {
    await expect(session.waitForCount(5, 100)).rejects.toThrow(
      "Timed out waiting for 5 SSE events from http://example.com/sse"
    );
  });

  it("should collect warnings", () => {
    session.appendWarning("warn 1");
    expect(session.warnings).toContain("warn 1");
  });

  it("should collect errors and reject waiters", async () => {
    const waitPromise = session.waitForEvent(() => true);
    session.appendError("error 1");
    
    expect(session.errors).toContain("error 1");
    await expect(waitPromise).rejects.toThrow("error 1");
  });
});
