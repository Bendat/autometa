---
sidebar_position: 6
---

# Events (test listeners)

Autometa can emit lifecycle events (feature/scenario/step/hook, status transitions, and errors). You can subscribe to these events to build custom reporting, debug logging, or integrations.

## Enable events

Add one or more modules to `events` in your `autometa.config.ts`. These modules are loaded for side effects (they should register listeners when imported).

```ts title="autometa.config.ts"
import { defineConfig } from "@autometa/config";

export default defineConfig({
  default: {
    runner: "vitest",
    roots: {
      features: ["features/**/*.feature"],
      steps: ["src/steps"],
    },
    events: ["src/support/autometa.events.ts"],
  },
});
```

## Listener modules

The simplest API is `registerTestListener`, which calls method-style handlers for each event type.

```ts title="src/support/autometa.events.ts"
import { registerTestListener } from "@autometa/events";

registerTestListener({
  onScenarioStarted({ event }) {
    console.log(`[scenario] start: ${event.scenario.name}`);
  },
  onStepCompleted({ event }) {
    const status = event.metadata?.status ?? "unknown";
    console.log(`[step] ${event.step.keyword}${event.step.text} (${status})`);
  },
  onError({ event }) {
    console.error(`[error] phase=${event.phase}`, event.error);
  },
});
```

## Emitted events

Autometa emits these event types:

- `feature.started` / `feature.completed`
- `rule.started` / `rule.completed`
- `scenarioOutline.started` / `scenarioOutline.completed`
- `example.started` / `example.completed`
- `scenario.started` / `scenario.completed`
- `step.started` / `step.completed`
- `hook.started` / `hook.completed`
- `status.changed`
- `error`

All events are delivered as an `EventEnvelope` with a monotonically increasing `sequence` field.

