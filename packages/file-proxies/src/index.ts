import { promises as fsp, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const arrayMutators = [
	"copyWithin",
	"fill",
	"pop",
	"push",
	"reverse",
	"shift",
	"sort",
	"splice",
	"unshift",
] as const;

type ArrayMutator = (typeof arrayMutators)[number];

const MUTATING_ARRAY_METHODS = new Set<ArrayMutator>(arrayMutators);

const TARGET_SYMBOL = Symbol.for("@autometa/file-proxies/target");
export const FileProxyControlSymbol = Symbol.for("@autometa/file-proxies/control");

export interface FileTransformer<Data, Raw> {
	parse(raw: Raw): Data;
	format(data: Data): Raw;
}

export interface FileProxyControl<Data extends object> {
	readonly path: string;
	flush(): Promise<void>;
	reload(): Promise<void>;
	snapshot(): Data;
}

export type FileProxy<Data extends object> = Data & {
	[FileProxyControlSymbol]: FileProxyControl<Data>;
};

export interface CreateFileProxySyncOptions<Data extends object, Raw> {
	readonly path: string;
	readonly defaults: Data;
	readonly transformer: FileTransformer<Data, Raw>;
	readonly io: SyncFileIO<Raw>;
	readonly autoPersist?: boolean;
	readonly onChange?: (snapshot: Data) => void;
}

export interface CreateFileProxyOptions<Data extends object, Raw> {
	readonly path: string;
	readonly defaults: Data;
	readonly transformer: FileTransformer<Data, Raw>;
	readonly io: AsyncFileIO<Raw>;
	readonly autoPersist?: boolean;
	readonly onChange?: (snapshot: Data) => void;
}

export interface JsonFileProxyOptions<Data extends object> {
	readonly path: string;
	readonly defaults: Data;
	readonly indent?: number | string;
	readonly autoPersist?: boolean;
	readonly onChange?: (snapshot: Data) => void;
}

export interface SyncFileIO<Raw> {
	exists(): boolean;
	read(): Raw;
	write(raw: Raw): void;
}

export interface AsyncFileIO<Raw> {
	exists(): Promise<boolean>;
	read(): Promise<Raw>;
	write(raw: Raw): Promise<void>;
}

type ProxyManager<Data extends object> = {
	readonly proxy: Data;
	setControl(control: FileProxyControl<Data>): void;
};

type OnMutation = () => void;

type CloneFn = <T>(value: T) => T;

function isArrayMutator(prop: string): prop is ArrayMutator {
	return (MUTATING_ARRAY_METHODS as ReadonlySet<string>).has(prop);
}

export function createFileProxySync<Data extends object, Raw>(
	options: CreateFileProxySyncOptions<Data, Raw>
): FileProxy<Data> {
	const {
		path: filePath,
		defaults,
		transformer,
		io,
		autoPersist = true,
		onChange,
	} = options;

	const rootData = initializeSync(defaults, transformer, io);
	const clone = createCloner();

	let pendingWrite: Promise<void> = Promise.resolve();

	const persist = (snapshot: Data) => {
		const formatted = transformer.format(snapshot);
		io.write(formatted);
		pendingWrite = Promise.resolve();
	};

	const manager: ProxyManager<Data> = createProxyManager<Data>(rootData, () => {
		const snapshot = clone(rootData);
		if (autoPersist) {
			persist(snapshot);
		}
		if (onChange) {
			onChange(clone(snapshot));
		}
	});

	const control: FileProxyControl<Data> = {
		path: filePath,
		async flush() {
			if (!autoPersist) {
				const snapshot = clone(rootData);
				persist(snapshot);
			}
			await pendingWrite;
		},
		async reload() {
			if (!io.exists()) {
				const snapshot = clone(defaults);
				persist(snapshot);
				replaceValue(rootData, snapshot, clone);
				return;
			}
			const raw = io.read();
			const parsed = transformer.parse(raw);
			replaceValue(rootData, parsed, clone);
		},
		snapshot() {
			return clone(rootData);
		},
	};

	manager.setControl(control);

	return manager.proxy as FileProxy<Data>;
}

export async function createFileProxy<Data extends object, Raw>(
	options: CreateFileProxyOptions<Data, Raw>
): Promise<FileProxy<Data>> {
	const {
		path: filePath,
		defaults,
		transformer,
		io,
		autoPersist = true,
		onChange,
	} = options;

	const rootData = await initializeAsync(defaults, transformer, io);
	const clone = createCloner();

	let writeChain: Promise<void> = Promise.resolve();

	const queuePersist = (snapshot: Data) => {
		const formatted = transformer.format(snapshot);
		writeChain = writeChain.then(() => io.write(formatted));
		writeChain = writeChain.catch((error) => {
			queueMicrotask(() => {
				throw error;
			});
			return Promise.reject(error);
		});
	};

	const manager: ProxyManager<Data> = createProxyManager<Data>(rootData, () => {
		const snapshot = clone(rootData);
		if (autoPersist) {
			queuePersist(snapshot);
		}
		if (onChange) {
			onChange(clone(snapshot));
		}
	});

	const control: FileProxyControl<Data> = {
		path: filePath,
		async flush() {
			if (!autoPersist) {
				const snapshot = clone(rootData);
				queuePersist(snapshot);
			}
			await writeChain;
		},
		async reload() {
			if (!(await io.exists())) {
				const snapshot = clone(defaults);
				await io.write(transformer.format(snapshot));
				replaceValue(rootData, snapshot, clone);
				return;
			}
			const raw = await io.read();
			const parsed = transformer.parse(raw);
			replaceValue(rootData, parsed, clone);
		},
		snapshot() {
			return clone(rootData);
		},
	};

	manager.setControl(control);

	return manager.proxy as FileProxy<Data>;
}

export function createJsonFileProxySync<Data extends object>(
	options: JsonFileProxyOptions<Data>
): FileProxy<Data> {
	const transformer = createJsonTransformer<Data>(options.indent);
	const io = createSyncJsonIO(options.path);
	const config = {
		path: options.path,
		defaults: options.defaults,
		transformer,
		io,
		...(options.autoPersist !== undefined ? { autoPersist: options.autoPersist } : {}),
		...(options.onChange ? { onChange: options.onChange } : {}),
	} satisfies CreateFileProxySyncOptions<Data, string>;
	return createFileProxySync<Data, string>(config);
}

export async function createJsonFileProxy<Data extends object>(
	options: JsonFileProxyOptions<Data>
): Promise<FileProxy<Data>> {
	const transformer = createJsonTransformer<Data>(options.indent);
	const io = createAsyncJsonIO(options.path);
	const config = {
		path: options.path,
		defaults: options.defaults,
		transformer,
		io,
		...(options.autoPersist !== undefined ? { autoPersist: options.autoPersist } : {}),
		...(options.onChange ? { onChange: options.onChange } : {}),
	} satisfies CreateFileProxyOptions<Data, string>;
	return createFileProxy<Data, string>(config);
}

function createJsonTransformer<Data>(indent?: number | string): FileTransformer<Data, string> {
	const spacing = indent === undefined ? 2 : indent;
	return {
		parse(raw) {
			return raw.trim().length === 0 ? ({} as Data) : (JSON.parse(raw) as Data);
		},
		format(data) {
			return `${JSON.stringify(data, null, spacing)}\n`;
		},
	};
}

function createSyncJsonIO(filePath: string): SyncFileIO<string> {
	return {
		exists() {
			return existsSync(filePath);
		},
		read() {
			return readFileSync(filePath, "utf-8");
		},
		write(raw) {
			ensureDirectorySync(filePath);
			writeFileSync(filePath, raw, "utf-8");
		},
	};
}

function createAsyncJsonIO(filePath: string): AsyncFileIO<string> {
	return {
		async exists() {
			try {
				await fsp.access(filePath);
				return true;
			} catch {
				return false;
			}
		},
		async read() {
			return await fsp.readFile(filePath, "utf-8");
		},
		async write(raw) {
			await ensureDirectoryAsync(filePath);
			await fsp.writeFile(filePath, raw, "utf-8");
		},
	};
}

function ensureDirectorySync(filePath: string) {
	const directory = path.dirname(filePath);
	if (!existsSync(directory)) {
		mkdirSync(directory, { recursive: true });
	}
}

async function ensureDirectoryAsync(filePath: string) {
	const directory = path.dirname(filePath);
	await fsp.mkdir(directory, { recursive: true });
}

function initializeSync<Data extends object, Raw>(
	defaults: Data,
	transformer: FileTransformer<Data, Raw>,
	io: SyncFileIO<Raw>
): Data {
	if (io.exists()) {
		const raw = io.read();
		return transformer.parse(raw);
	}
	const clone = createCloner();
	const snapshot = clone(defaults);
	io.write(transformer.format(snapshot));
	return snapshot;
}

async function initializeAsync<Data extends object, Raw>(
	defaults: Data,
	transformer: FileTransformer<Data, Raw>,
	io: AsyncFileIO<Raw>
): Promise<Data> {
	if (await io.exists()) {
		const raw = await io.read();
		return transformer.parse(raw);
	}
	const clone = createCloner();
	const snapshot = clone(defaults);
	await io.write(transformer.format(snapshot));
	return snapshot;
}

function createProxyManager<Data extends object>(
	root: Data,
	onMutation: OnMutation
): ProxyManager<Data> {
	const targetToProxy = new WeakMap<object, object>();
	const proxyToTarget = new WeakMap<object, object>();
	let control: FileProxyControl<Data> | undefined;

	const unwrap = (value: unknown) => {
		if (isObjectLike(value)) {
			const original = proxyToTarget.get(value as object);
			if (original) {
				return original;
			}
		}
		return value;
	};

	const buildProxy = (target: object): object => {
		let cached = targetToProxy.get(target);
		if (cached) {
			return cached;
		}

		const handler: ProxyHandler<object> = {
			get(obj, prop, receiver) {
				if (prop === FileProxyControlSymbol && target === root) {
					return control;
				}
				if (prop === TARGET_SYMBOL) {
					return target;
				}
				const value = Reflect.get(obj, prop, receiver);
				if (isObjectLike(value)) {
					return buildProxy(value as object);
				}
				if (
					Array.isArray(obj) &&
					typeof prop === "string" &&
					typeof value === "function" &&
					isArrayMutator(prop)
				) {
					return (...args: unknown[]) => {
						const result = (value as (this: unknown[], ...arguments_: unknown[]) => unknown).apply(
							obj,
							args
						);
						onMutation();
						return result;
					};
				}
				return value;
			},
			set(obj, prop, value, receiver) {
				const unwrapped = unwrap(value);
				const result = Reflect.set(obj, prop, unwrapped, receiver);
				onMutation();
				return result;
			},
			deleteProperty(obj, prop) {
				const result = Reflect.deleteProperty(obj, prop);
				onMutation();
				return result;
			},
			defineProperty(obj, prop, descriptor) {
				const result = Reflect.defineProperty(obj, prop, descriptor);
				onMutation();
				return result;
			},
		};

		cached = new Proxy(target, handler);
		targetToProxy.set(target, cached);
		proxyToTarget.set(cached, target);
		return cached;
	};

	const proxy = buildProxy(root) as Data;

	return {
		proxy,
		setControl(value: FileProxyControl<Data>) {
			control = value;
		},
	};
}

function replaceValue<Data extends object>(
	target: Data,
	source: Data,
	clone: CloneFn
) {
	if (Array.isArray(target) && Array.isArray(source)) {
		target.splice(0, target.length, ...source.map((item) => clone(item)));
		return;
	}
	if (isPlainObject(target) && isPlainObject(source)) {
		const sourceKeys = new Set(Object.keys(source));
		for (const key of Object.keys(target)) {
			if (!sourceKeys.has(key)) {
				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
				delete (target as Record<string, unknown>)[key];
			}
		}
		for (const [key, value] of Object.entries(source)) {
			(target as Record<string, unknown>)[key] = clone(value);
		}
		return;
	}
	throw new Error("File proxies require object or array data");
}

function createCloner(): CloneFn {
	const structured = (globalThis as { structuredClone?: <T>(value: T) => T }).structuredClone;
	if (structured) {
		return <T>(value: T): T => structured(value);
	}
	return <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
}

function isObjectLike(value: unknown): value is Record<PropertyKey, unknown> {
	return typeof value === "object" && value !== null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return Object.prototype.toString.call(value) === "[object Object]";
}
