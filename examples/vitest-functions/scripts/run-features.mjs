import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const args = process.argv.slice(2);
const isWatch = args.includes("--watch");
const passthroughArgs = args.filter((a) => a !== "--watch");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(__dirname, "..", "..", "..");
const apiRoot = path.resolve(workspaceRoot, "examples", ".api");

const port = Number(process.env.PORT ?? 4000);
// Force loopback so tests that use localhost work consistently.
const healthUrl = `http://127.0.0.1:${port}/health`;

const shouldSkipApi =
  process.env.AUTOMETA_SKIP_EXAMPLES_API === "1" ||
  process.env.AUTOMETA_SKIP_EXAMPLES_API === "true";

function spawnProcess(command, commandArgs, { cwd, env } = {}) {
  return spawn(command, commandArgs, {
    cwd,
    env: {
      ...process.env,
      ...env,
    },
    stdio: "inherit",
  });
}

async function fetchJson(url, { timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function isHealthy() {
  try {
    const json = await fetchJson(healthUrl, { timeoutMs: 500 });
    return json?.status === "ok";
  } catch {
    return false;
  }
}

async function waitForHealth({ timeoutMs }) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    // eslint-disable-next-line no-await-in-loop
    if (await isHealthy()) {
      return;
    }

    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 150));
  }

  throw new Error(`Timed out waiting for API healthcheck at ${healthUrl}`);
}

async function killProcess(proc) {
  if (!proc || proc.killed) {
    return;
  }

  // Best-effort graceful shutdown.
  proc.kill("SIGTERM");

  const exited = await new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 2000);
    proc.once("exit", () => {
      clearTimeout(timeout);
      resolve(true);
    });
  });

  if (!exited) {
    proc.kill("SIGKILL");
  }
}

async function main() {
  let apiProcess;

  const runVitest = () => {
    const vitestArgs = isWatch
      ? ["exec", "vitest", ...passthroughArgs]
      : ["exec", "vitest", "run", ...passthroughArgs];

    const proc = spawnProcess("pnpm", vitestArgs, { cwd: packageRoot });

    return new Promise((resolve) => {
      proc.once("exit", (code) => resolve(code ?? 1));
    });
  };

  const alreadyHealthy = await isHealthy();

  if (!shouldSkipApi && !alreadyHealthy) {
    // Run the API directly so we can terminate it without pnpm treating SIGTERM as
    // a script failure.
    apiProcess = spawnProcess(
      "node",
      ["--loader", "ts-node/esm", "src/index.ts"],
      {
        cwd: apiRoot,
        env: {
          // Keep it local and predictable.
          HOST: "127.0.0.1",
          PORT: String(port),
          // ts-node is only used for this dev-only test harness.
          TS_NODE_TRANSPILE_ONLY: "true",
          // Reduce noise in CI logs.
          NODE_ENV: process.env.NODE_ENV ?? "test",
        },
      },
    );

    try {
      await waitForHealth({ timeoutMs: 15_000 });
    } catch (err) {
      await killProcess(apiProcess);
      throw err;
    }
  }

  try {
    const code = await runVitest();
    process.exitCode = code;
  } finally {
    await killProcess(apiProcess);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
