# Autometa Examples

This workspace hosts living documentation for Autometa. Each example package demonstrates a complete acceptance workflow against the reference features in `.features` and the companion API deployed from `.api`.

## Layout

```
examples/
  .api/               # Minimal REST API powering end-to-end scenarios
  .features/          # Authoritative feature files shared by all examples
  jest-functions/     # Jest-based step definitions using functional style
  jest-decorators/    # Jest-based step definitions using decorator APIs
  vitest-functions/   # Vitest step definitions using functional style
  vitest-decorators/  # Vitest step definitions using decorator APIs
```

  ### Quick tip: `.not` everywhere

  Assertion plugins now support negation out of the box. In any example you can write:

  ```
  Then the response status should not be 404
  And the response header "content-type" should not equal "text/plain"
  ```

  Behind the scenes, the plugin is re-instantiated with a negated `ensure`, so your existing matchers work unchanged.

## Development Flow

1. Capture behaviour in `.features` using Gherkin. Treat these as business-facing documentation and acceptance criteria.
2. Expand the API inside `.api` only when a feature requires new capabilities.
3. Mirror the features in each example package so users can compare implementations across runtimes and styles.
4. Keep scenarios comprehensive: data tables, outlines, tag filtering, magic tags (`@skip`, `@only`), HTTP interactions, and custom helpers.

All packages will build on the shared features to keep the documentation consistent and minimise divergence across examples.
