---
"@autometa/http": minor
---

feat(http): add response transform helper

- New `HTTP.transform(...)` helper to project a response into another shape.
- Transformer runs after parsing and schema validation.
- Useful for mapping to domain models while keeping return type inference.
