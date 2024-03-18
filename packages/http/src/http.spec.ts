import { describe, it, expect, vi } from "vitest";
import { HTTP } from "./http";
import { HTTPClient } from "./http-client";
import { HTTPRequest, HTTPRequestBuilder } from "./http-request";
import { HTTPResponse, HTTPResponseBuilder } from "./http-response";
import { HTTPAdditionalOptions } from "./types";

describe("HTTP", () => {
  describe("create", () => {
    it("should create a new instance of the HTTP Client", () => {
      const client = HTTP.create();
      expect(client).toBeInstanceOf(HTTP);
    });
  });
  class MockClient extends HTTPClient {
    constructor(readonly testFn: ReturnType<typeof vi.fn>) {
      super();
    }
    async request<TRequestType, TResponseType>(
      request: HTTPRequest<TRequestType>,
      options?: HTTPAdditionalOptions<unknown> | undefined
    ): Promise<HTTPResponse<TResponseType>> {
      console.log(request);

      return this.testFn(request, options) as HTTPResponse<TResponseType>;
    }
  }

  describe("resolving dynamic headers", () => {
    it("should resolve dynamic headers", async () => {
      const response = HTTPResponseBuilder.create().status(200).build();
      const request = HTTPRequestBuilder.create();
      const fn = vi.fn().mockImplementation((req: HTTPRequest) => {
        response.request = req;
        return response;
      });
      const client = new MockClient(fn);
      const http = new HTTP(client, request).sharedHeader("foo", () => "bar");
      const result = await http.get();
      expect(result.request.headers["foo"]).toBe("bar");
    });
  });
  describe("allowPlainText", () => {
    it("should throw an error when allowPlainText is false", async () => {
      const response = HTTPResponseBuilder.create().data("Hello World").build();
      const fn = vi.fn().mockImplementation((req: HTTPRequest) => {
        response.request = req;
        return response;
      });
      const client = new MockClient(fn);
      const http = new HTTP(client).allowPlainText(false);
      await expect(() => http.get()).rejects.toThrowError(
        `Could not parse a response as json, and this request was not configured to allow plain text responses.
To allow plain text responses, use the 'allowPlainText' method on the HTTP client.

Hello World`
      );
    });

    it("should return the response when allowPlainText is true", async () => {
      const response = HTTPResponseBuilder.create().data("Hello World").build();
      const fn = vi.fn().mockReturnValue(response);
      const client = new MockClient(fn);
      const http = new HTTP(client).allowPlainText(true);
      const result = await http.get();
      expect(result).toBe(response);
    });

    it("should return a new HTTP instance", () => {
      const response = HTTPResponseBuilder.create().data("Hello World").build();
      const fn = vi.fn().mockReturnValue(response);
      const client = new MockClient(fn);
      const http = new HTTP(client).allowPlainText(true);
      const result = http.allowPlainText(false);
      expect(result).toBeInstanceOf(HTTP);
      expect(result).not.toBe(http);
    });
  });

  describe("hooks", () => {
    describe("onSend", () => {
      it("should call the hook when the request is sent", async () => {
        const request = HTTPRequestBuilder.create()
          .url(undefined as unknown as string)
          .method("GET")
          .data(undefined as unknown as string)
          .build();
        const response = HTTPResponseBuilder.create().build();
        const fn = vi.fn().mockReturnValue(response);
        const hook = vi
          .fn()
          .mockImplementation((data: HTTPResponse<unknown>) => {
            expect(data).toStrictEqual(request);
          });
        const client = new MockClient(fn);
        const http = new HTTP(client).onSend("test hook", hook);
        await http.get();
        expect(hook).toHaveBeenCalledWith(request);
      });

      it("should propagate errors from the hook", async () => {
        const response = HTTPResponseBuilder.create().build();
        const fn = vi.fn().mockReturnValue(response);
        const hook = vi.fn().mockImplementation((_: HTTPResponse<unknown>) => {
          throw new Error("test error");
        });
        const client = new MockClient(fn);
        const http = new HTTP(client).onSend("test hook", hook);
        await expect(() => http.get()).rejects.toThrowError(
          "An error occurred while sending a request in hook: 'test hook'"
        );
      });
    });

    describe("onReceive", () => {
      it("should call the hook when the response is received", async () => {
        const response = HTTPResponseBuilder.create().build();
        const fn = vi.fn().mockReturnValue(response);
        const hook = vi
          .fn()
          .mockImplementation((data: HTTPResponse<unknown>) => {
            expect(data).toStrictEqual(response);
          });
        const client = new MockClient(fn);
        const http = new HTTP(client).onReceive("test hook", hook);
        await http.get();
        expect(hook).toHaveBeenCalledWith(response);
      });

      it("should propagate errors from the hook", async () => {
        const response = HTTPResponseBuilder.create().build();
        const fn = vi.fn().mockReturnValue(response);
        const hook = vi.fn().mockImplementation((_: HTTPResponse<unknown>) => {
          throw new Error("test error");
        });
        const client = new MockClient(fn);
        const http = new HTTP(client).onReceive("test hook", hook);
        await expect(() => http.get()).rejects.toThrowError(
          "An error occurred while receiving a response in hook: 'test hook'"
        );
      });
    });
  });

  describe("schemas", () => {
    it("should throw an error if there is no schema and requireSchema is true", () => {
      const response = HTTPResponseBuilder.create().status(200).build();
      const fn = vi.fn().mockReturnValue(response);
      const client = new MockClient(fn);
      const http = new HTTP(client).requireSchema(true);
      expect(() => http.get()).rejects.toThrowError(
        `No parser registered for status code 200 but 'requireSchema' is true`
      );
    });

    it("should throw an error if the response status does not match a schema", () => {
      const response = HTTPResponseBuilder.create().status(200).build();
      const fn = vi.fn().mockReturnValue(response);
      const client = new MockClient(fn);
      const http = new HTTP(client).requireSchema(true).schema(vi.fn(), 400);
      expect(() => http.get()).rejects.toThrowError(
        `No parser registered for status code 200 but 'requireSchema' is true`
      );
    });

    it("should return the response if the status matches a schema", async () => {
      const response = HTTPResponseBuilder.create().status(200).build();
      const fn = vi.fn().mockReturnValue(response);
      const client = new MockClient(fn);
      const http = new HTTP(client).requireSchema(true).schema(vi.fn(), 200);
      const result = await http.get();
      expect(result).toBe(response);
    });

    it("should return the validated response if the status matches a schema", async () => {
      const response = HTTPResponseBuilder.create().status(200).data("FooBar");
      const validated = response.derive().data("Hello World").build();
      const fn = vi.fn().mockReturnValue(response.build());
      const client = new MockClient(fn);
      const schema = vi.fn().mockReturnValue(validated);
      const http = new HTTP(client)
        .requireSchema(true)
        .allowPlainText(true)
        .schema(schema, 200);
      const { data } = await http.get();
      expect(data).toBe(validated);
    });
  });
});
