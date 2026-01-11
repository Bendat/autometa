---
sidebar_position: 1
---

<!-- cSpell:disable -->
# Getting Started

Autometa v1 ships today with a unified runtime that behaves the same way across Jest, Vitest, and Playwright. This section gives you the top-level concepts, then points you to the per-runner instructions and advanced tooling such as the DTO builder and the `ensure(...)` assertion plugins.

## Prerequisites

- `Node.js` 18+
- `PNPM` 8+ (the repo and examples use PNPM workspaces)
- TypeScript 5+ in your project
- One of the supported runners: Jest, VITEST, or Playwright Test

## Choose your path

1. Start with [Installation](installation.md) and expand the runner tab that matches your stack.
2. Review [Runners & loaders](runners.md) to understand how each runner ingests `.feature` files.
3. Walk through [Authoring executors & steps](authoring.md) to configure the `CucumberRunner`, Autometa CLI, and your preferred step style (functions or decorators).
4. Mirror the structure shown in `/examples/<runner>-functions` or `/examples/<runner>-decorators`—those folders are kept up to date with the release packages.
5. When you need a data factory or ergonomic assertions, jump ahead to the DTO builder and `@autometa/assertions` sections at the bottom of the installation doc.
6. For monorepos (multiple apps/APIs, Nx/Nest workspaces), use [Monorepos: groups, modules, and isolated worlds](monorepos.md).

:::info Example parity
Each example project shares the same `.feature` files and world shape. Once you are comfortable in one runner, you can inspect the others to see the minimal deltas Autometa requires.
:::

## After installation

- Register hooks, scopes, and shared state in `autometa.config.ts` using the patterns described in [Reference → Configuration](../reference/configuration.md).
- Explore the architecture diagrams to understand how the coordinator drives executors and runners during a scenario lifecycle.
- Keep an eye on the package READMEs inside `/packages/**`—they highlight APIs that may not be fully spelled out in the docs yet.

<!-- cSpell:enable -->
