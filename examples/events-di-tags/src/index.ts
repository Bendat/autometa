import { createContainer, createToken } from "@autometa/injection";
import { EventDispatcher, EventEmitter, registerTestListener } from "@autometa/events";

const LoggerToken = createToken<(message: string) => void>("examples/events-di-tags/logger");

const container = createContainer();
container.registerValue(LoggerToken, (message) => {
  // eslint-disable-next-line no-console
  console.info(message);
});

const dispatcher = EventDispatcher.create({ container });
const emitter = new EventEmitter(dispatcher);

const unsubscribe = registerTestListener(
  {
    onEvent({ event, tags, resolve }) {
      const log = resolve(LoggerToken);
      log(`[onEvent] ${event.type} tags=${tags.join(" ") || "<none>"}`);
    },

    onFeatureStarted({ event, tags, resolve }) {
      // Tags are just strings: you decide the convention.
      if (!tags.includes("@smoke")) {
        return;
      }

      const log = resolve(LoggerToken);
      log(`[onFeatureStarted] ${event.feature.name}`);
    },
  },
  { dispatcher }
);

await emitter.featureStarted({
  feature: {
    id: "feature-1",
    name: "Brew Buddy",
    location: { line: 1, column: 1 },
    tags: [],
    comments: [],
  },
  tags: ["@smoke", "billing"],
});

unsubscribe();
