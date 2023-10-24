import { describe, it, expect, vi, beforeEach } from "vitest";
import { SchemaMap } from "./schema.map";
import { AxiosRequestConfig } from "axios";
import { AxiosExecutor } from "./axios-executor";
import { RequestState } from "./types";
import * as axios from "axios";
vi.mock("axios", async () => {
  const mockAxios = {
    default: vi.fn()
  };

  return mockAxios;
});
let map: SchemaMap;
const axiosConfig: AxiosRequestConfig = {
  url: "http://localhost:3000",
  method: "GET"
};
const requestState: RequestState = {
  data: {},
  fullUrl: "http://localhost:3000",
  headers: new Map(),
  method: "GET",
  params: new Map(),
  responseType: undefined,
  route: [],
  url: "http://localhost:3000"
};
beforeEach(() => {
  map = new SchemaMap();
  vi.clearAllMocks();
});
describe("axios executor", () => {
  it("should execute a request", async () => {
    vi.spyOn(axios, "default").mockResolvedValueOnce({
      status: 200,
      data: { a: 1 }
    });
    const sut = new AxiosExecutor(axiosConfig, map, requestState, false);
    await sut.tryRequest();
    expect(sut.requestSucceeded).toBe(true);
    expect(sut.error).toBe(undefined);
    expect(sut.validationFailed).toBe(false);
  });

  it("should get validated response with no validation", async () => {
    const data = { a: 1 };
    vi.spyOn(axios, "default").mockResolvedValueOnce({
      status: 200,
      data
    });
    const sut = new AxiosExecutor(axiosConfig, map, requestState, false);
    await sut.tryRequest();
    const response = sut.getValidatedResponse();
    expect(response.data).toEqual(data);
    expect(response.status).toEqual(200);
  });

  it("should get a validated response with validation", async () => {
    const data = { a: 1 };
    vi.spyOn(axios, "default").mockResolvedValueOnce({
      status: 200,
      data
    });
    const schema = { parse: vi.fn().mockReturnValue(data) };
    map.register(schema, 200);
    const sut = new AxiosExecutor(axiosConfig, map, requestState, true);
    await sut.tryRequest();
    const response = sut.getValidatedResponse();
    expect(response.data).toEqual(data);
    expect(response.status).toEqual(200);
  });
  it("should make a request but fail validation", async () => {
    const data = { a: 1 };
    vi.spyOn(axios, "default").mockResolvedValueOnce({
      status: 200,
      data
    });
    const error = new Error("validation failed");
    const schema = {
      parse: vi.fn().mockImplementation(() => {
        throw error;
      })
    };
    map.register(schema, 201);
    const sut = new AxiosExecutor(axiosConfig, map, requestState, true);
    await sut.tryRequest();
    expect(sut.requestSucceeded).toBe(true);
    expect(sut.error).toBeInstanceOf(Error);
    expect(sut.validationFailed).toBe(true);
  });
  it("should make a request and fail to validate due to missing schema", async () => {
    const data = { a: 1 };
    vi.spyOn(axios, "default").mockResolvedValueOnce({
      status: 200,
      data
    });
    const sut = new AxiosExecutor(axiosConfig, map, requestState, true);
    await sut.tryRequest();
    expect(sut.requestSucceeded).toBe(true);
    expect(sut.error).toBeInstanceOf(Error);
    expect(sut.validationFailed).toBe(true);
  });
  it("should make a request and fail due to axios error", async () => {
    const error = new Error("axios error");
    vi.spyOn(axios, "default").mockRejectedValueOnce(error);
    const sut = new AxiosExecutor(axiosConfig, map, requestState, false);
    await sut.tryRequest();
    expect(sut.requestSucceeded).toBe(false);
    expect(sut.error).toBeInstanceOf(Error);
    expect(sut.validationFailed).toBe(true);
  });
});
