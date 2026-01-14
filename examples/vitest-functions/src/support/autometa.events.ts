import { registerTestListener } from "@autometa/events";

const debugFlag = typeof process !== "undefined"
  ? (process.env.AUTOMETA_EVENTS_DEBUG ?? "")
  : "";

const enabled = (() => {
  const normalized = String(debugFlag).trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
})();

if (enabled) {
  registerTestListener({
    onScenarioStarted({ event }) {
      // eslint-disable-next-line no-console
      console.log(`[autometa] scenario.started: ${event.scenario.name}`);
    },
    onStepCompleted({ event }) {
      const status = event.metadata?.status ?? "unknown";
      // eslint-disable-next-line no-console
      console.log(`[autometa] step.completed: ${event.step.keyword}${event.step.text} (${status})`);
    },
    onError({ event }) {
      // eslint-disable-next-line no-console
      console.error(`[autometa] error (${event.phase})`, event.error);
    },
  });
}
