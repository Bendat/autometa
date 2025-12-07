---
sidebar_position: 2
---

# Installation

Autometa v1 is published as a workspace of packages. Until the public release, install directly from this repository by linking the packages you need.

## Install dependencies

```bash
pnpm install
```

## Bootstrap an example runner

```bash
pnpm dev:examples:api
```

- The example API project runs against the latest coordinator and executor packages.
- Swap in other examples from `/examples` to validate different stacks.

## Bring Autometa into your project

1. Add the packages you need to your `package.json` using local path references (e.g. `"@autometa/runner": "workspace:*"`).
2. Import the new decorators and scope-aware hooks directly from the rewritten packages inside `/packages`.
3. Copy the configuration shown in the README for your runner until these docs include full snippets.
