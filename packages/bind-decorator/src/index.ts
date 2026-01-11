type AnyMethod = (...args: unknown[]) => unknown;

function ensureMethod(
	propertyKey: string | symbol,
	descriptor: TypedPropertyDescriptor<AnyMethod> | undefined
): asserts descriptor is TypedPropertyDescriptor<AnyMethod> & { value: AnyMethod } {
	if (!descriptor || typeof descriptor.value !== "function") {
		throw new TypeError(
			`Only methods can be decorated with @Bind/@Freeze. <${String(
				propertyKey
			)}> is not a method.`
		);
	}
}

function createBoundDescriptor(
	propertyKey: string | symbol,
	descriptor: TypedPropertyDescriptor<AnyMethod> & { value: AnyMethod },
	options: { freeze: boolean }
): TypedPropertyDescriptor<AnyMethod> {
	const { freeze } = options;
	const enumerable = descriptor.enumerable ?? false;
	const method = descriptor.value;

	const boundDescriptor: TypedPropertyDescriptor<AnyMethod> = {
		configurable: !freeze,
		enumerable,
		get(this: unknown): AnyMethod {
			const bound = method.bind(this);
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
		boundDescriptor.set = function setBoundMethod(this: unknown, value: AnyMethod): void {
			if (typeof value !== "function") {
				throw new TypeError(
					`Cannot assign non-function value to bound method <${String(
						propertyKey
					)}>.`
				);
			}

			const bound = value.bind(this);
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

export const Bind: MethodDecorator = (target, propertyKey, descriptor) => {
	const typedDescriptor = descriptor as unknown as TypedPropertyDescriptor<AnyMethod> | undefined;
	ensureMethod(propertyKey, typedDescriptor);
	return createBoundDescriptor(propertyKey, typedDescriptor, { freeze: false }) as unknown as typeof descriptor;
};

export const Freeze: MethodDecorator = (target, propertyKey, descriptor) => {
	const typedDescriptor = descriptor as unknown as TypedPropertyDescriptor<AnyMethod> | undefined;
	ensureMethod(propertyKey, typedDescriptor);
	return createBoundDescriptor(propertyKey, typedDescriptor, { freeze: true }) as unknown as typeof descriptor;
};

export { Bind as bindDecorator, Freeze as freezeDecorator };