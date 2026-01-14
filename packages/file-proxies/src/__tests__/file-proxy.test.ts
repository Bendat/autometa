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

  it("loads existing JSON files and tolerates empty content", () => {
    const { directory, filePath } = createTempFile("existing-json");
    tempDirectories.push(directory);

    writeFileSync(filePath, JSON.stringify({ count: 7 }, null, 2));
    const existing = createJsonFileProxySync({
      path: filePath,
      defaults: { count: 0 },
    });

    expect(existing.count).toBe(7);

    writeFileSync(filePath, "   ");
    const empty = createJsonFileProxySync({
      path: filePath,
      defaults: { count: 1 },
    });

    expect(Object.keys(empty)).toEqual([]);
  });

  it("creates missing directories for sync and async writes", async () => {
    const directory = mkdtempSync(path.join(tmpdir(), "nested-sync-"));
    tempDirectories.push(directory);

    const nestedSyncPath = path.join(directory, "sync", "data.json");
    const syncProxy = createJsonFileProxySync({
      path: nestedSyncPath,
      defaults: { value: 1 },
    });

    expect(existsSync(nestedSyncPath)).toBe(true);
    syncProxy.value = 2;
    expect(JSON.parse(readFileSync(nestedSyncPath, "utf-8")).value).toBe(2);

    const nestedAsyncPath = path.join(directory, "async", "data.json");
    const asyncProxy = await createJsonFileProxy({
      path: nestedAsyncPath,
      defaults: { value: 1 },
    });

    asyncProxy.value = 3;
    await (asyncProxy[FileProxyControlSymbol] as FileProxyControl<{ value: number }>).flush();
    expect(JSON.parse(await fsp.readFile(nestedAsyncPath, "utf-8")).value).toBe(3);
  });

  it("defers async writes when autoPersist is false", async () => {
    const { directory, filePath } = createTempFile("async-manual");
    tempDirectories.push(directory);

    const proxy = await createJsonFileProxy({
      path: filePath,
      defaults: { value: 1 },
      autoPersist: false,
    });

    proxy.value = 2;
    const stored = JSON.parse(await fsp.readFile(filePath, "utf-8")) as { value: number };
    expect(stored.value).toBe(1);

    const control = proxy[FileProxyControlSymbol] as FileProxyControl<{ value: number }>;
    await control.flush();
    const flushed = JSON.parse(await fsp.readFile(filePath, "utf-8")) as { value: number };
    expect(flushed.value).toBe(2);
  });

  it("recreates missing async files on reload", async () => {
    const { directory, filePath } = createTempFile("async-reload");
    tempDirectories.push(directory);

    const proxy = await createJsonFileProxy({
      path: filePath,
      defaults: { count: 4 },
    });

    const control = proxy[FileProxyControlSymbol] as FileProxyControl<{ count: number }>;
    await control.flush();
    rmSync(filePath, { force: true });
    expect(existsSync(filePath)).toBe(false);

    await control.reload();
    expect(existsSync(filePath)).toBe(true);
    expect(proxy.count).toBe(4);
  });

  it("supports array roots and proxy assignment", async () => {
    const { directory, filePath } = createTempFile("array-root");
    tempDirectories.push(directory);

    const transformer: FileTransformer<string[], string> = {
      parse(raw) {
        const trimmed = raw.trim();
        return trimmed.length === 0 ? [] : (JSON.parse(trimmed) as string[]);
      },
      format(data) {
        return JSON.stringify(data);
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

    const proxy = createFileProxySync<string[], string>({
      path: filePath,
      defaults: ["alpha"],
      transformer,
      io,
    });

    proxy.push("beta");
    const control = proxy[FileProxyControlSymbol] as FileProxyControl<string[]>;

    writeFileSync(filePath, JSON.stringify(["one", "two"]));
    await control.reload();
    expect(proxy).toEqual(["one", "two"]);

    const { directory: mirrorDirectory, filePath: mirrorPath } = createTempFile("proxy-assign");
    tempDirectories.push(mirrorDirectory);

    const objectProxy = createJsonFileProxySync({
      path: mirrorPath,
      defaults: { node: { value: 1 }, mirror: {} as { value?: number } },
    });

    objectProxy.mirror = objectProxy.node;
    objectProxy.node.value = 2;
    expect(objectProxy.mirror.value).toBe(2);
  });

  it("throws when reloading mismatched data shapes", async () => {
    const { directory, filePath } = createTempFile("shape-error");
    tempDirectories.push(directory);

    const proxy = createJsonFileProxySync({
      path: filePath,
      defaults: { count: 1 },
    });

    writeFileSync(filePath, JSON.stringify(["bad"]));

    const control = proxy[FileProxyControlSymbol] as FileProxyControl<{ count: number }>;
    await expect(control.reload()).rejects.toThrow("File proxies require object or array data");
  });

  it("tracks delete and defineProperty mutations", () => {
    const { directory, filePath } = createTempFile("define-delete");
    tempDirectories.push(directory);

    const snapshots: Array<Record<string, unknown>> = [];
    const proxy = createJsonFileProxySync({
      path: filePath,
      defaults: { value: 1 },
      onChange(snapshot) {
        snapshots.push(snapshot);
      },
    });

    Object.defineProperty(proxy, "flag", {
      value: true,
      enumerable: true,
      configurable: true,
      writable: true,
    });
    delete (proxy as { flag?: boolean }).flag;

    expect(snapshots.length).toBeGreaterThanOrEqual(2);
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
