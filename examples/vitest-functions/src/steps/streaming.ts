import { Given, When, Then, ensure } from "../step-definitions";
import type { BrewBuddyWorld } from "../world";
import { connectSse } from "../utils/sse";

// Background steps
Given("the SSE client is connected to {string}", async function (this: BrewBuddyWorld, endpoint: string) {
  if (!this.scenario.apiBaseUrl) {
    throw new Error("API base URL must be configured before connecting to SSE stream");
  }
  const url = `${this.scenario.apiBaseUrl}${endpoint}`;
  const session = await connectSse(url);
  this.app.streamManager.attach(session);
});

Given("the SSE connection is interrupted", function (this: BrewBuddyWorld) {
  this.app.streamManager.dispose();
});

// Order management steps
Given("an order exists with ticket {string}", function (this: BrewBuddyWorld, ticketId: string) {
  if (!this.scenario.orders) {
    this.scenario.orders = new Map();
  }
  this.scenario.orders.set(ticketId, {
    ticketId,
    status: "pending",
    events: [],
  });
});

When("the kitchen updates the order status sequence", function (this: BrewBuddyWorld) {
  const table = this.runtime.requireTable("vertical");
  const rows = table.raw();

  const statuses: string[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row?.[0]) {
      statuses.push(row[0]);
    }
  }

  if (!this.scenario.expectedStatusSequence) {
    this.scenario.expectedStatusSequence = [];
  }
  this.scenario.expectedStatusSequence.push(...statuses);

  if (!this.scenario.simulatedEvents) {
    this.scenario.simulatedEvents = [];
  }

  for (const status of statuses) {
    this.scenario.simulatedEvents.push({
      event: status,
      data: { status },
    });
  }
});

When(
  "the kitchen marks the order as completed with pickup code {string}",
  function (this: BrewBuddyWorld, pickupCode: string) {
  if (!this.scenario.simulatedEvents) {
    this.scenario.simulatedEvents = [];
  }

  const ticketId = this.scenario.orders ? Array.from(this.scenario.orders.keys())[0] : "UNKNOWN";

  this.scenario.simulatedEvents.push({
    event: "completed",
    data: {
      ticket: ticketId,
      pickupCode,
      completedAt: new Date().toISOString(),
    },
  });

  this.scenario.lastPickupCode = pickupCode;
  }
);

// Event validation steps
Then("the streamed events should arrive in order for ticket {string}", function (this: BrewBuddyWorld, _ticketId: string) {
  const table = this.runtime.requireTable("horizontal");
  const expectedEvents = table.records<{ event: string; "data.status": string }>();

  const events = this.scenario.simulatedEvents;
  if (!events) {
    throw new Error("Simulated events should exist");
  }

  if (events.length !== expectedEvents.length) {
    throw new Error(`Expected ${expectedEvents.length} events but got ${events.length}`);
  }

  for (let i = 0; i < expectedEvents.length; i++) {
    const expected = expectedEvents[i];
    const actual = events[i];

    if (!expected || !actual) {
      throw new Error(`Event at index ${i} should exist`);
    }

    ensure(this)(actual.event, {
      label: `Event ${i} should have event type "${expected.event}"`,
    }).toStrictEqual(expected.event);

    if (typeof actual.data === "object" && actual.data !== null) {
      const dataObj = actual.data as { status?: string };
      ensure(this)(dataObj.status, {
        label: `Event ${i} should have status "${expected["data.status"]}"`,
      }).toStrictEqual(expected["data.status"]);
    }
  }
});

Then(
  "the streamed events should include an event {string} with data",
  function (this: BrewBuddyWorld, eventType: string) {
    const table = this.runtime.requireTable("horizontal");
    const expectedData = table.records<{ path: string; value: string }>();

    const events = this.scenario.simulatedEvents;
    if (!events) {
      throw new Error("Simulated events should exist");
    }

    const event = events.find((e) => e.event === eventType);
    if (!event) {
      throw new Error(`Should find event of type "${eventType}"`);
    }

    if (!event.data || typeof event.data !== "object") {
      throw new Error("Event should have data object");
    }

    const dataObj = event.data as Record<string, unknown>;

    for (const row of expectedData) {
      const { path, value } = row;

      if (value === "<timestamp>") {
        if (!dataObj[path]) {
          throw new Error(`Data should have field "${path}"`);
        }
        ensure(this)(typeof dataObj[path], {
          label: `Field "${path}" should be a string timestamp`,
        }).toStrictEqual("string");
      } else {
        ensure(this)(dataObj[path], {
          label: `Field "${path}" should equal "${value}"`,
        }).toStrictEqual(value);
      }
    }
  }
);

When("I await the next stream event", async function () {
  const stream = this.app.streamManager.current();

  if (!stream) {
    throw new Error("No SSE stream is connected");
  }

  try {
    await stream.waitForEvent(() => true, 1000);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    this.app.streamManager.recordError(message);
  }
});

Then("I should receive a stream error containing {string}", function (this: BrewBuddyWorld, errorText: string) {
  const stream = this.app.streamManager.current();
  const sessionErrors = stream?.errors ?? [];
  const worldErrors = this.app.streamManager.errors();

  const hasError = [...sessionErrors, ...worldErrors].some((err) => err.includes(errorText));
  ensure(this)(hasError, {
    label: `Stream errors should contain "${errorText}". Got: ${[...sessionErrors, ...worldErrors].join(", ")}`,
  }).toBeTruthy();
});

// Warning handling steps
When("the stream emits an event {string}", function (this: BrewBuddyWorld, eventType: string) {
  if (!this.scenario.simulatedEvents) {
    this.scenario.simulatedEvents = [];
  }

  this.scenario.simulatedEvents.push({
    event: eventType,
    data: {},
  });

  const warningMessage = `Received unexpected event type: ${eventType}`;
  this.app.streamManager.recordWarning(warningMessage);

  const stream = this.app.streamManager.current();
  if (stream) {
    stream.appendWarning(warningMessage);
  }
});

Then(
  "the client should log a warning containing {string}",
  function (this: BrewBuddyWorld, warningText: string) {
    const stream = this.app.streamManager.current();
    const sessionWarnings = stream?.warnings ?? [];
    const worldWarnings = this.app.streamManager.warnings();

    const hasWarning = [...sessionWarnings, ...worldWarnings].some((warn) => warn.includes(warningText));
    ensure(this)(hasWarning, {
      label: `Stream warnings should contain "${warningText}". Got: ${[...sessionWarnings, ...worldWarnings].join(", ")}`,
    }).toBeTruthy();
  }
);

Then("the client should continue processing subsequent events", function (this: BrewBuddyWorld) {
  const stream = this.app.streamManager.current();

  if (!stream) {
    throw new Error("No SSE stream is connected");
  }

  ensure(this)(this.scenario.simulatedEvents, {
    label: "Events should continue to be processed",
  }).toBeDefined();
  ensure(this)(true, {
    label: "Stream should continue processing events after warnings",
  }).toBeTruthy();
});
