# @autometa/fixture-proxies

Diagnostic helpers for Autometa fixtures and worlds. The v1 refactor keeps
fixtures as plain classes, so this package wraps them with proxies that provide
useful runtime guarantees without forcing a framework. Two capabilities are
available:

- **Access tracking** – records reads and assignments, guards against typos, and
	suggests likely matches when an unknown property is accessed.
- **Error boundaries** – wraps fixture methods so thrown errors become
	`AutomationError`s with context about which fixture/method failed.

```ts
import { createFixtureProxy } from "@autometa/fixture-proxies";

class HttpFixture {
	baseUrl?: string;

	request(path: string) {
		if (!this.baseUrl) {
			throw new Error("Missing baseUrl");
		}
		return fetch(`${this.baseUrl}${path}`);
	}
}

const fixture = new HttpFixture();
const { value: proxy } = createFixtureProxy(fixture, {
	access: {
		allow: ["baseUrl"],
	},
});

proxy.request("/status");
// -> throws AutomationError:
//    "An error occurred in HttpFixture.request."

proxy.basUrl = "https://api.example";
// -> throws AutomationError:
//    "Attempted to access 'basUrl' before it was assigned.
//      Did you mean:
//      - baseUrl"
```

## API surface

### `createFixtureProxy(target, options)`

Wrap a fixture instance. Returns an object with a `value` property pointing to
the wrapped instance.

- `options.access` – set to `false` to disable access tracking, or provide an
	object with
	- `allow`: keys that are legitimately missing at construction time
	- `formatMessage`: customise the thrown error text
	- `onViolation`: intercept missing-property access before the default error
	- `suggestClosest`: toggle or limit suggestion count
- `options.errors` – set to `false` to skip error wrapping, or provide an object
	with
	- `include`: predicate to select which methods to wrap
	- `formatMessage`: override default AutomationError message
	- `transform`: adapt the underlying error before attaching it as `cause`

### Access diagnostics helpers

- `withAccessTracking(target, options)` – low-level helper used by
	`createFixtureProxy`. Returns a proxy and records diagnostics in a WeakMap.
- `getReadCount(instance, key)` and `getAssignedValues(instance, key)` – query
	per-property diagnostics.
- `getAccessDiagnostics(instance)` – retrieve the raw `reads` and `writes`
	`Map`s.

### Error boundary helpers

- `withErrorBoundary(target, options)` – mutates `target` so its methods throw
	`AutomationError`s. Automatically awaits promises and preserves original
	method names for stack traces.

## Migration notes

- Uses symbols/WeakMaps instead of `$accessed` and `$assigned` magic fields.
- No reliance on legacy decorators; compose it with the new DI container or
	plain object construction.
- Designed so the upcoming `@autometa/app` rewrite can inject the same
	diagnostics without tightly coupling to this package.