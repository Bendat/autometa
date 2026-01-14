import { HTTPError, type HTTPResponse } from "@autometa/core/http";

/**
 * Scenario-scoped HTTP response history.
 *
 * Keeps the latest response/error accessible for assertion plugins and steps.
 */
export class HttpHistoryService {
  lastResponse?: HTTPResponse<unknown>;
  lastResponseBody?: unknown;
  lastResponseHeaders?: Record<string, string>;
  lastError?: unknown;

  async track<T>(request: Promise<HTTPResponse<T>>): Promise<HTTPResponse<T>> {
    try {
      const response = await request;
      this.lastResponse = response;
      this.lastResponseBody = response.data;
      this.lastResponseHeaders = normalizeHeaders(response.headers ?? {});
      delete this.lastError;

      if (response.status >= 400) {
        throw new HTTPError(
          `Request failed with status ${response.status}`,
          response.request,
          response
        );
      }

      return response;
    } catch (error) {
      this.lastError = error;

      if (error instanceof HTTPError && error.response) {
        this.lastResponse = error.response;
        this.lastResponseBody = error.response.data;
        this.lastResponseHeaders = normalizeHeaders(error.response.headers ?? {});
        throw error;
      }

      delete this.lastResponse;
      delete this.lastResponseBody;
      delete this.lastResponseHeaders;
      throw error;
    }
  }

  extractErrorStatus(): number | undefined {
    const error = this.lastError;
    if (error instanceof HTTPError && error.response) {
      const status = error.response.status;
      this.lastResponse = error.response;
      this.lastResponseBody = error.response.data;
      this.lastResponseHeaders = normalizeHeaders(error.response.headers ?? {});
      return status;
    }
    return undefined;
  }
}

function normalizeHeaders(headers: Record<string, string>): Record<string, string> {
  const normalised: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    normalised[key.toLowerCase()] = String(value);
  }
  return normalised;
}
