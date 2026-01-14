---
sidebar_position: 1
---

# Getting Started

<!-- cSpell:disable -->
Autometa v1 ships today with a unified runtime that behaves the same way across Jest, Vitest, and Playwright. This section gives you the top-level concepts, then points you to the per-runner instructions and advanced tooling such as the DTO builder and the `ensure(...)` assertion plugins.

## Prerequisites

- `Node.js` 18+
- `PNPM` 8+ (the repo and examples use PNPM workspaces)
- TypeScript 5+ in your project
- One of the supported runners: Jest, VITEST, or Playwright Test

## Choose your path

1. Start with [Installation](installation) and expand the runner tab that matches your stack.
2. Follow [From scratch: build an Autometa test suite](from-scratch) to scaffold a minimal suite (flat or group-based) you can grow over time.
3. Review [Runners & loaders](runners) to understand how each runner ingests `.feature` files.
4. Walk through [Authoring executors & steps](authoring) to configure the `CucumberRunner`, Autometa CLI, and your preferred step style (functions or decorators).
5. Mirror the structure shown in `/examples/<runner>-functions` or `/examples/<runner>-decorators`—those folders are kept up to date with the release packages.
6. When you need a data factory or ergonomic assertions, jump ahead to the DTO builder and `@autometa/assertions` sections at the bottom of the installation doc.
7. For monorepos (multiple apps/APIs, Nx/Nest workspaces), use [Monorepos: groups, modules, and isolated worlds](monorepos).

:::info Example parity
Each example project shares the same `.feature` files and world shape. Once you are comfortable in one runner, you can inspect the others to see the minimal deltas Autometa requires.
:::

## After installation

- Register hooks, scopes, and shared state in `autometa.config.ts` using the patterns described in [Reference → Configuration](../reference/configuration.md).
- Explore the architecture diagrams to understand how the coordinator drives executors and runners during a scenario lifecycle.
- Keep an eye on the package READMEs inside `/packages/**`—they highlight APIs that may not be fully spelled out in the docs yet.

<!-- cSpell:enable -->
