import { describe, it, expect } from "vitest";
import { MetaConfigBuilder } from "./request-meta.config";

describe(MetaConfigBuilder.name, () => {
  describe("adding schema mapping", () => {
    it("should add a schema mapping", () => {
      const parser = { parse: <T>(data: T) => data };
      const config = new MetaConfigBuilder().schema(parser, 200).build();
      expect(config.schemas.toObject()).toEqual({ 200: parser });
    });

    it("should multiple schema mappings", () => {
      const parser = { parse: <T>(data: T) => data };
      const config = new MetaConfigBuilder()
        .schema(parser, 200)
        .schema(parser, 201)
        .build();
      expect(config.schemas.toObject()).toEqual({ 200: parser, 201: parser });
    });

    it("should add multiple range based schema mappings", () => {
      const parser = { parse: <T>(data: T) => data };
      const config = new MetaConfigBuilder()
        .schema(parser, { from: 200, to: 202 })
        .build();
      expect(config.schemas.toObject()).toEqual({
        200: parser,
        201: parser,
        202: parser
      });
    });
  });

  describe('adding "onBeforeSend" hooks', () => {
    it("adding a before send hook", () => {
      const hook = () => undefined;
      const config = new MetaConfigBuilder().onBeforeSend("hook", hook).build();
      expect(config.onSend).toEqual([["hook", hook]]);
    });

    it("adding multiple before send hooks", () => {
      const hook = () => undefined;
      const config = new MetaConfigBuilder().onBeforeSend("hook", hook).build();
      expect(config.onSend).toEqual([["hook", hook]]);
    });
  });

  describe('adding "onReceiveResponse" hooks', () => {
    it("adding a before send hook", () => {
      const hook = () => undefined;
      const config = new MetaConfigBuilder()
        .onReceiveResponse("hook", hook)
        .build();
      expect(config.onReceive).toEqual([["hook", hook]]);
    });

    it("adding multiple before send hooks", () => {
      const hook = () => undefined;
      const config = new MetaConfigBuilder()
        .onReceiveResponse("hook", hook)
        .build();
      expect(config.onReceive).toEqual([["hook", hook]]);
    });
  });

  describe("deriving a request meta config", () => {
    it("should derive a config with the same values", () => {
      const parser = { parse: <T>(data: T) => data };
      const hook = () => undefined;
      const configBuilder = new MetaConfigBuilder()
        .schema(parser, 200)
        .onBeforeSend("send", hook)
        .onReceiveResponse("receive", hook);
      const original = configBuilder.build();
      const derived = configBuilder.derive().build();
      expect(derived.schemas).toEqual(original.schemas);
      expect(derived.onSend).toEqual(original.onSend);
      expect(derived.onReceive).toEqual(original.onReceive);
    });
  });
});
