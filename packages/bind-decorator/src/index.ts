type AnyMethod = (...args: any[]) => unknown; // eslint-disable-line @typescript-eslint/no-explicit-any

function ensureMethod<T extends AnyMethod>(
	propertyKey: string | symbol,
	descriptor: TypedPropertyDescriptor<T> | undefined
): asserts descriptor is TypedPropertyDescriptor<T> & { value: T } {
	if (!descriptor || typeof descriptor.value !== "function") {
		throw new TypeError(
			`Only methods can be decorated with @Bind/@Freeze. <${String(
				propertyKey
			)}> is not a method.`
		);
	}
}

function createBoundDescriptor<T extends AnyMethod>(
	propertyKey: string | symbol,
	descriptor: TypedPropertyDescriptor<T>,
	method: T,
	options: { freeze: boolean }
): TypedPropertyDescriptor<T> {
	const { freeze } = options;
	const enumerable = descriptor.enumerable ?? false;

	const boundDescriptor: TypedPropertyDescriptor<T> = {
		configurable: !freeze,
		enumerable,
		get(this: unknown): T {
			const bound = method.bind(this) as T;
			Object.defineProperty(this, propertyKey, {
				value: bound,
				configurable: !freeze,
				writable: !freeze,
				enumerable,
			});
			return bound;
		},
	};

	if (!freeze) {
		boundDescriptor.set = function setBoundMethod(this: unknown, value: T): void {
			if (typeof value !== "function") {
				throw new TypeError(
					`Cannot assign non-function value to bound method <${String(
						propertyKey
					)}>.`
				);
			}

			const bound = value.bind(this) as T;
			Object.defineProperty(this, propertyKey, {
				value: bound,
				configurable: true,
				writable: true,
				enumerable,
			});
		};
	}

	return boundDescriptor;
}

export function Bind<T extends AnyMethod>(
	target: object,
	propertyKey: string | symbol,
							descriptor: TypedPropertyDescriptor<T> | undefined
						): TypedPropertyDescriptor<T> | void {
	ensureMethod(propertyKey, descriptor);
	const method = descriptor.value;
	return createBoundDescriptor(propertyKey, descriptor, method, { freeze: false });
}

export function Freeze<T extends AnyMethod>(
	target: object,
	propertyKey: string | symbol,
							descriptor: TypedPropertyDescriptor<T> | undefined
						): TypedPropertyDescriptor<T> | void {
	ensureMethod(propertyKey, descriptor);
	const method = descriptor.value;
	return createBoundDescriptor(propertyKey, descriptor, method, { freeze: true });
}

export { Bind as bindDecorator, Freeze as freezeDecorator };