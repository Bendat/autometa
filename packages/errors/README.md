# @autometa/errors

Robust error primitives used across the Autometa ecosystem.

## Installation

```bash
pnpm add @autometa/errors
```

## Usage

```ts
import {
	AutomationError,
	formatErrorCauses,
	formatErrorTree,
	printErrorTree,
	raise,
	safe,
	safeAsync,
} from "@autometa/errors";

function loadConfig(path: string) {
	const result = safe(() => readFileSync(path, "utf8"));
	if (!result.ok) {
			raise("Failed to load configuration", { cause: result.error });
	}
	return result.value;
}

try {
	loadConfig("./app.json");
} catch (error) {
	const automation = AutomationError.wrap(error);
	console.error(formatErrorCauses(automation, { includeStack: false }));
	printErrorTree(automation, { includeStack: false });
}
```

## API highlights

- `AutomationError` – first-class error base with helpers to detect (`isAutomationError`) and wrap unknown values (`wrap`).
- `raise` – construct and throw `AutomationError` or custom subclasses (legacy constructors supported) with optional nested causes.
- `safe`/`safeAsync` – execute functions, capturing failures as `AutomationError` instances while returning a discriminated union result.
- `formatErrorCauses` – produce readable multi-line descriptions of error chains with configurable stack inclusion and depth limits.
- `formatErrorTree` / `printErrorTree` – pretty-print error causes as an indented tree, ideal for console or structured logs.