# Events + DI + Tags example

This example shows how to:

- provide a DI container to `@autometa/events` so listeners can resolve dependencies via the event envelope
- attach tags when emitting events
- use tags inside listeners (for filtering/routing)

## Try it

From the repo root:

- `pnpm --filter @autometa/examples-events-di-tags install` (if needed)
- `pnpm --filter @autometa/examples-events-di-tags run demo`

You should see log lines produced by the listener.
