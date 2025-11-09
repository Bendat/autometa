# @autometa/datetime

Utilities for creating deterministic dates and measuring time differences in
Autometa tests. The package provides:

- `Dates` – convenience shortcuts (yesterday, nextWeek, midnight, etc.), phrase
	parsing (`"2 days from now"`) and explicit time offsets.
- `Dates.iso` / `Dates.fmt` – ISO string or YYYY-MM-DD formatted variants of the
	same API surface.
- `Time.diff` – helpers for calculating the difference between two dates in
	milliseconds, seconds, minutes, hours, days, or weeks.

```ts
import { Dates, Time } from "@autometa/datetime";

// Shortcut access
const tomorrow = Dates.tomorrow;
const nextFortnight = Dates.iso.nextFortnight;

// Phrase parsing & offsets
const launch = Dates.fromPhrase("3 weeks from now");
const reminder = Dates.make(-2, "days");

// Time differences
const diffInHours = Time.diff.hours(new Date(), reminder);
```

## Custom clocks

For deterministic scenarios (e.g. unit tests) you can inject your own clock via
`createDates`:

```ts
import { createDates } from "@autometa/datetime";

const fixed = new Date("2024-01-01T08:00:00Z");
const clock = { now: () => fixed };

const dates = createDates({ clock });
expect(dates.today.toISOString()).toBe("2024-01-01T08:00:00.000Z");
```

## Migration notes

- Singletons (`Dates`, `Time`) remain for convenience but now wrap factories so
	you can create isolated instances with custom clocks.
- Phrase parsing errors throw `AutomationError` with actionable messaging.
- All packages enforce >=90% cobertura across statements/branches/functions.