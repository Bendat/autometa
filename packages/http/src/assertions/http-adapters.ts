type HeadersLike = {
	get(name: string): string | null;
	has?(name: string): boolean;
	entries?: () => IterableIterator<[string, string]>;
	[Symbol.iterator]?: () => IterableIterator<[string, string]>;
};

type HeaderSource = HeadersLike | Record<string, unknown>;

export type HttpResponseLike = {
	status: number;
	statusText?: string;
	headers: HeaderSource;
	data?: unknown;
	raw?: unknown;
};

/**
 * Adapts an @autometa/http `HTTPResponse` (or any similarly-shaped object) into a
 * stable `HttpResponseLike` for HTTP assertions.
 */
export function fromHttpResponse<T extends { headers: Record<string, string> }>(
	response: T & { status: number; statusText?: string; data?: unknown }
): HttpResponseLike {
	return {
		status: response.status,
		statusText: response.statusText ?? "",
		headers: response.headers,
		data: response.data,
		raw: response,
	};
}

/**
 * Adapts a fetch-style response (or any similarly-shaped object) into a stable
 * `HttpResponseLike` for HTTP assertions.
 */
export function fromFetchResponse(
	response: { status: number; statusText?: string; headers: HeadersLike },
	data?: unknown
): HttpResponseLike {
	return {
		status: response.status,
		statusText: response.statusText ?? "",
		headers: response.headers,
		data,
		raw: response,
	};
}
