import { createHash } from "node:crypto";
import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { homedir } from "node:os";
import { join, resolve as resolvePath, isAbsolute } from "node:path";

/**
 * Resolve the directory used by the CLI to write compiled/cached artifacts.
 *
 * Why this exists:
 * - The CLI may need to transpile TS config/step modules at runtime.
 * - Writing them to a stable cache avoids recompiling on every run.
 *
 * Design goals:
 * - Prefer locations that are already ignored (node_modules/.cache) when available.
 * - Otherwise use an OS-level cache directory to avoid polluting the project root.
 * - Allow explicit overrides via env vars.
 */
export async function resolveCliCacheDir(cwd: string): Promise<string> {
  const envCacheDir = process.env.AUTOMETA_CACHE_DIR?.trim();
  if (envCacheDir) {
    return isAbsolute(envCacheDir) ? envCacheDir : resolvePath(cwd, envCacheDir);
  }

  const envHome = process.env.AUTOMETA_HOME?.trim();
  if (envHome) {
    const base = isAbsolute(envHome) ? envHome : resolvePath(cwd, envHome);
    return join(base, "cache");
  }

  // If node_modules exists, prefer node_modules/.cache/autometa (already ignored).
  // This keeps the cache project-local without requiring any extra gitignore rules.
  const nodeModules = join(cwd, "node_modules");
  if (await pathExists(nodeModules)) {
    return join(nodeModules, ".cache", "autometa");
  }

  // Otherwise, fall back to an OS-level cache dir (or tmp as a last resort).
  const osBase = resolveOsCacheBase();
  const projectKey = createHash("sha1").update(resolvePath(cwd)).digest("hex");
  return join(osBase, projectKey, "cache");
}

function resolveOsCacheBase(): string {
  const xdg = process.env.XDG_CACHE_HOME?.trim();
  if (xdg) {
    return join(xdg, "autometa");
  }

  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Caches", "autometa");
  }

  if (process.platform === "win32") {
    const local = process.env.LOCALAPPDATA?.trim();
    if (local) {
      return join(local, "autometa", "Cache");
    }
    return join(homedir(), "AppData", "Local", "autometa", "Cache");
  }

  // linux / other unix
  return join(homedir(), ".cache", "autometa");
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}
