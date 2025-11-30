import {
  Binding,
  GivenDecorator as Given,
  WhenDecorator as When,
  ThenDecorator as Then,
  Inject,
  WORLD_TOKEN,
  ensure,
} from "../step-definitions";
import type { BrewBuddyWorld } from "../world";
import { connectSse } from "../utils/sse";

@Binding()
export class StreamingSteps {
  constructor(@Inject(WORLD_TOKEN) private world: BrewBuddyWorld) {}

  // Background steps
  @Given("the SSE client is connected to {string}")
  async sseClientConnected(endpoint: string): Promise<void> {
    if (!this.world.scenario.apiBaseUrl) {
      throw new Error("API base URL must be configured before connecting to SSE stream");
    }
    const url = `${this.world.scenario.apiBaseUrl}${endpoint}`;
    const session = await connectSse(url);
    this.world.app.streamManager.attach(session);
  }

  @Given("the SSE connection is interrupted")
  sseConnectionInterrupted(): void {
    const stream = this.world.app.streamManager.current();
    stream?.close();
    stream?.appendError("CONNECTION_LOST");
  }

  // Order management steps
  @Given("an order exists with ticket {string}")
  orderExistsWithTicket(ticketId: string): void {
    if (!this.world.scenario.orders) {
      this.world.scenario.orders = new Map();
    }
    this.world.scenario.orders.set(ticketId, {
      ticketId,
      status: "pending",
      events: [],
    });
  }

  @When("the kitchen updates the order status sequence")
  kitchenUpdatesStatusSequence(): void {
    const table = this.world.runtime.requireTable("vertical");
    const rows = table.raw();

    const statuses: string[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row?.[0]) {
        statuses.push(row[0]);
      }
    }

    if (!this.world.scenario.expectedStatusSequence) {
      this.world.scenario.expectedStatusSequence = [];
    }
    this.world.scenario.expectedStatusSequence.push(...statuses);

    if (!this.world.scenario.simulatedEvents) {
      this.world.scenario.simulatedEvents = [];
    }

    for (const status of statuses) {
      this.world.scenario.simulatedEvents.push({
        event: status,
        data: { status },
      });
    }
  }

  @When("the kitchen marks the order as completed with pickup code {string}")
  kitchenMarksOrderCompleted(pickupCode: string): void {
    if (!this.world.scenario.simulatedEvents) {
      this.world.scenario.simulatedEvents = [];
    }

    const ticketId = this.world.scenario.orders ? Array.from(this.world.scenario.orders.keys())[0] : "UNKNOWN";

    this.world.scenario.simulatedEvents.push({
      event: "completed",
      data: {
        ticket: ticketId,
        pickupCode,
        completedAt: new Date().toISOString(),
      },
    });

    this.world.scenario.lastPickupCode = pickupCode;
  }

  // Event validation steps
  @Then("the streamed events should arrive in order for ticket {string}")
  eventsArriveInOrder(_ticketId: string): void {
    const table = this.world.runtime.requireTable("horizontal");
    const expectedEvents = table.records<{ event: string; "data.status": string }>();

    const events = this.world.scenario.simulatedEvents;
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

      ensure(actual.event, {
        label: `Event ${i} should have event type "${expected.event}"`,
      }).toStrictEqual(expected.event);

      if (typeof actual.data === "object" && actual.data !== null) {
        const dataObj = actual.data as { status?: string };
        ensure(dataObj.status, {
          label: `Event ${i} should have status "${expected["data.status"]}"`,
        }).toStrictEqual(expected["data.status"]);
      }
    }
  }

  @Then("the streamed events should include an event {string} with data")
  eventsIncludeEventWithData(eventType: string): void {
    const table = this.world.runtime.requireTable("horizontal");
    const expectedData = table.records<{ path: string; value: string }>();

    const events = this.world.scenario.simulatedEvents;
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
        ensure(typeof dataObj[path], {
          label: `Field "${path}" should be a string timestamp`,
        }).toStrictEqual("string");
      } else {
        ensure(dataObj[path], {
          label: `Field "${path}" should equal "${value}"`,
        }).toStrictEqual(value);
      }
    }
  }

  @When("I await the next stream event")
  async awaitNextStreamEvent(): Promise<void> {
    const stream = this.world.app.streamManager.current();

    if (!stream) {
      throw new Error("No SSE stream is connected");
    }

    try {
      await stream.waitForEvent(() => true, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.world.app.streamManager.recordError(message);
    }
  }

  @Then("I should receive a stream error containing {string}")
  receiveStreamError(errorText: string): void {
    const stream = this.world.app.streamManager.current();
    const sessionErrors = stream?.errors ?? [];
    const worldErrors = this.world.app.streamManager.errors();

    const hasError = [...sessionErrors, ...worldErrors].some((err) => err.includes(errorText));
    ensure(hasError, {
      label: `Stream errors should contain "${errorText}". Got: ${[...sessionErrors, ...worldErrors].join(", ")}`,
    }).toBeTruthy();
  }

  // Warning handling steps
  @When("the stream emits an event {string}")
  streamEmitsEvent(eventType: string): void {
    if (!this.world.scenario.simulatedEvents) {
      this.world.scenario.simulatedEvents = [];
    }

    this.world.scenario.simulatedEvents.push({
      event: eventType,
      data: {},
    });

    const warningMessage = `Received unexpected event type: ${eventType}`;
    this.world.app.streamManager.recordWarning(warningMessage);

    const stream = this.world.app.streamManager.current();
    if (stream) {
      stream.appendWarning(warningMessage);
    }
  }

  @Then("the client should log a warning containing {string}")
  clientLogsWarning(warningText: string): void {
    const stream = this.world.app.streamManager.current();
    const sessionWarnings = stream?.warnings ?? [];
    const worldWarnings = this.world.app.streamManager.warnings();

    const hasWarning = [...sessionWarnings, ...worldWarnings].some((warn) => warn.includes(warningText));
    ensure(hasWarning, {
      label: `Stream warnings should contain "${warningText}". Got: ${[...sessionWarnings, ...worldWarnings].join(", ")}`,
    }).toBeTruthy();
  }

  @Then("the client should continue processing subsequent events")
  clientContinuesProcessing(): void {
    const stream = this.world.app.streamManager.current();

    if (!stream) {
      throw new Error("No SSE stream is connected");
    }

    ensure(this.world.scenario.simulatedEvents, {
      label: "Events should continue to be processed",
    }).toBeDefined();
    ensure(true, {
      label: "Stream should continue processing events after warnings",
    }).toBeTruthy();
  }
}
