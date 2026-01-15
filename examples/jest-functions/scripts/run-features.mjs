import { spawn } from "node:child_process";
import process from "node:process";

const PACKAGE_ROOT = new URL("../", import.meta.url);
const API_ROOT = new URL("../../.api/", import.meta.url);

const DEFAULT_PORT = Number.parseInt(process.env.EXAMPLES_API_PORT ?? "4000", 10);
const SKIP_API = process.env.AUTOMETA_SKIP_EXAMPLES_API === "1" || process.env.AUTOMETA_SKIP_EXAMPLES_API === "true";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isApiHealthy(port) {
  const url = `http://127.0.0.1:${port}/health`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 750);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return false;
    const json = await res.json().catch(() => null);
    return Boolean(json && json.status === "ok");
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForApiHealthy(port, { timeoutMs }) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await isApiHealthy(port)) return;
    await sleep(200);
  }

  throw new Error(`Timed out waiting for API to become healthy on port ${port}`);
}

function startApiServer(port) {
  const child = spawn(process.execPath, ["--loader", "ts-node/esm", "src/index.ts"], {
    cwd: API_ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: String(port),
      TS_NODE_TRANSPILE_ONLY: "true",
    },
  });

  return child;
}

function runJest({ watch, extraArgs }) {
  const args = ["--config", "jest.config.cjs", ...extraArgs];
  if (watch) args.push("--watch");

  const child = spawn("jest", args, {
    cwd: PACKAGE_ROOT,
    stdio: "inherit",
    env: process.env,
  });

  return child;
}

async function main() {
  const argv = process.argv.slice(2);
  const watch = argv.includes("--watch");
  const extraArgs = argv.filter((a) => a !== "--watch");

  const port = DEFAULT_PORT;

  let apiChild = null;
  if (!SKIP_API) {
    const alreadyHealthy = await isApiHealthy(port);
    if (!alreadyHealthy) {
      apiChild = startApiServer(port);
      await waitForApiHealthy(port, { timeoutMs: 15_000 });
    }
  }

  const testChild = runJest({ watch, extraArgs });

  const shutdown = async (exitCode = 0) => {
    if (apiChild && !apiChild.killed) {
      apiChild.kill("SIGTERM");
      await Promise.race([
        new Promise((resolve) => apiChild.once("exit", resolve)),
        sleep(2_000),
      ]);

      if (!apiChild.killed) {
        apiChild.kill("SIGKILL");
      }
    }

    process.exit(exitCode);
  };

  process.on("SIGINT", () => {
    testChild.kill("SIGINT");
  });

  process.on("SIGTERM", () => {
    testChild.kill("SIGTERM");
  });

  testChild.on("exit", async (code, signal) => {
    if (signal) {
      await shutdown(1);
      return;
    }
    await shutdown(code ?? 1);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
