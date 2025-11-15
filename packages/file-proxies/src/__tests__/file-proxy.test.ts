import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { promises as fsp } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  createJsonFileProxy,
  createJsonFileProxySync,
  createFileProxySync,
  FileProxyControlSymbol,
  type FileProxyControl,
  type FileTransformer,
  type SyncFileIO,
} from "../index";

describe("file proxies", () => {
  const tempDirectories: string[] = [];

  afterEach(() => {
    while (tempDirectories.length > 0) {
      const dir = tempDirectories.pop();
      if (dir) {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it("creates and persists synchronously with JSON defaults", () => {
    const { directory, filePath } = createTempFile("sync-json");
    tempDirectories.push(directory);

    const proxy = createJsonFileProxySync({
      path: filePath,
      defaults: { count: 1, user: { name: "Initial" } },
    });

    expect(existsSync(filePath)).toBe(true);
    let stored = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>;
    expect(stored.count).toBe(1);

    proxy.count = 42;
    proxy.user.name = "Updated";

    stored = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>;
    expect(stored.count).toBe(42);
    expect((stored.user as Record<string, unknown>).name).toBe("Updated");
  });

  it("defers writes when autoPersist is false", async () => {
    const { directory, filePath } = createTempFile("manual-json");
    tempDirectories.push(directory);

    const defaults = { version: 1 };
    const proxy = createJsonFileProxySync({
      path: filePath,
      defaults,
      autoPersist: false,
    });

    proxy.version = 2;

    let stored = JSON.parse(readFileSync(filePath, "utf-8")) as { version: number };
    expect(stored.version).toBe(1);

    const control = proxy[FileProxyControlSymbol] as FileProxyControl<typeof defaults>;
    await control.flush();

    stored = JSON.parse(readFileSync(filePath, "utf-8")) as { version: number };
    expect(stored.version).toBe(2);
  });

  it("supports asynchronous persistence for JSON files", async () => {
    const { directory, filePath } = createTempFile("async-json");
    tempDirectories.push(directory);

    const proxy = await createJsonFileProxy({
      path: filePath,
      defaults: { history: [] as string[] },
    });

    proxy.history.push("first");
    proxy.history.push("second");

    const control = proxy[FileProxyControlSymbol] as FileProxyControl<{ history: string[] }>;
    await control.flush();

    const stored = JSON.parse(await fsp.readFile(filePath, "utf-8")) as { history: string[] };
    expect(stored.history).toEqual(["first", "second"]);
  });

  it("reloads external mutations from disk", async () => {
    const { directory, filePath } = createTempFile("reload-json");
    tempDirectories.push(directory);

    const proxy = await createJsonFileProxy({
      path: filePath,
      defaults: { flag: false, nested: { count: 0 } },
    });

    const control = proxy[FileProxyControlSymbol] as FileProxyControl<{ flag: boolean; nested: { count: number } }>;
    await control.flush();

    const external = { flag: true, nested: { count: 99 } };
    await fsp.writeFile(filePath, `${JSON.stringify(external, null, 2)}\n`, "utf-8");

    await control.reload();

    expect(proxy.flag).toBe(true);
    expect(proxy.nested.count).toBe(99);
  });

  it("honors custom transformers and sync IO", async () => {
    const { directory, filePath } = createTempFile("custom-transformer");
    tempDirectories.push(directory);

    interface CustomData {
      entries: string[];
    }

    const transformer: FileTransformer<CustomData, string> = {
      parse(raw) {
        const trimmed = raw.trim();
        return trimmed.length === 0
          ? { entries: [] }
          : { entries: trimmed.split("|").filter(Boolean) };
      },
      format(data) {
        return `${data.entries.join("|")}`;
      },
    };

    const io: SyncFileIO<string> = {
      exists: () => existsSync(filePath),
      read: () => readFileSync(filePath, "utf-8"),
      write(raw) {
        ensureDirectory(filePath);
        writeFileSync(filePath, raw, "utf-8");
      },
    };

    const proxy = createFileProxySync<CustomData, string>({
      path: filePath,
      defaults: { entries: [] },
      transformer,
      io,
    });

    proxy.entries.push("alpha");
    proxy.entries.push("beta");

    const contents = readFileSync(filePath, "utf-8");
    expect(contents).toBe("alpha|beta");

    const control = proxy[FileProxyControlSymbol] as FileProxyControl<CustomData>;
    await control.reload();
    proxy.entries.push("delta");

    const snapshot = control.snapshot();
    expect(snapshot.entries).toEqual(["alpha", "beta", "delta"]);
  });

  it("emits snapshots via onChange callback", () => {
    const { directory, filePath } = createTempFile("change-hook");
    tempDirectories.push(directory);

    const snapshots: Array<{ value: number }> = [];
    const proxy = createJsonFileProxySync({
      path: filePath,
      defaults: { value: 0 },
      onChange(snapshot) {
        snapshots.push(snapshot);
      },
    });

    proxy.value = 10;
    proxy.value = 20;

    expect(snapshots.length).toBeGreaterThanOrEqual(2);
    expect(snapshots[0].value).toBe(10);
    expect(snapshots.at(-1)?.value).toBe(20);

    snapshots[0].value = 99;
    expect(proxy.value).toBe(20);
  });
});

function createTempFile(prefix: string): { directory: string; filePath: string } {
  const directory = mkdtempSync(path.join(tmpdir(), `${prefix}-`));
  const filePath = path.join(directory, "data.json");
  return { directory, filePath };
}

function ensureDirectory(filePath: string) {
  const directory = path.dirname(filePath);
  if (!existsSync(directory)) {
    mkdirSyncRecursive(directory);
  }
}

function mkdirSyncRecursive(directory: string) {
  mkdirSync(directory, { recursive: true });
}
