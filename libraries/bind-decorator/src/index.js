// eslint-disable-next-line @typescript-eslint/ban-types
export function Bind(_target, propertyKey, descriptor) {
    if (!descriptor || typeof descriptor.value !== "function") {
        throw new TypeError(`Only methods can be decorated with @bind. <${propertyKey}> is not a method!`);
    }
    return {
        configurable: true,
        get() {
            const bound = descriptor.value?.bind(this);
            Object.defineProperty(this, propertyKey, {
                value: bound,
                configurable: true,
                writable: true,
            });
            return bound;
        },
        // eslint-disable-next-line @typescript-eslint/ban-types
        set(value) {
            const bound = value.bind(this);
            Object.defineProperty(this, propertyKey, {
                value: bound,
                configurable: true,
                writable: true,
            });
            return bound;
        },
    };
}
// eslint-disable-next-line @typescript-eslint/ban-types
export function Freeze(_target, propertyKey, descriptor) {
    if (!descriptor || typeof descriptor.value !== "function") {
        throw new TypeError(`Only methods can be decorated with @bind. <${propertyKey}> is not a method!`);
    }
    return {
        configurable: false,
        writable: false,
        get() {
            const bound = descriptor.value?.bind(this);
            Object.defineProperty(this, propertyKey, {
                value: bound,
                configurable: true,
                writable: true,
            });
            return bound;
        },
    };
}
