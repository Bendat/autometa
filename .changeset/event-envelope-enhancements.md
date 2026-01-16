---
"@autometa/events": minor
"@autometa/testrail-cucumber": minor
---

### @autometa/events

- Add `currentScope`, `docstring`, and `table` fields to `EventEnvelope` for richer listener context
- `currentScope: ExecutionScope` is derived from the event type (feature, scenario, step, etc.)
- `docstring?: EnvelopeDocstring` contains the step's docstring content and optional mediaType
- `table?: readonly (readonly string[])[]` contains the step's data table as a 2D array
- Refactor `EventDispatcher.dispatch()` to accept `DispatchContext` instead of a plain tags array

### @autometa/testrail-cucumber

- Add `login` command to store TestRail credentials securely on the user's device
- Add `logout` command to remove stored credentials
- Add `set-url` command to update the stored URL without re-entering credentials
- Add `set-project` command to update the default project ID without re-entering credentials
- Stored credentials are used automatically when CLI flags are omitted
