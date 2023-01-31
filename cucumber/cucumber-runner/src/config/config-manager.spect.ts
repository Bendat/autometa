// import {
//   AutometaConfig,
//   ConfigManager,
//   validateConfig,
// } from "./config-manager";
// import j from "joi";
// import { beforeEach, describe, expect, jest, test, it } from "@jest/globals";
// import { lie } from "src/utils/lie";

// const validConfig = {
//   app: jest.fn(),
//   runHooksInsideTests: false,
//   runner: {
//     name: "test",
//     beforeAll: lie<>(jest.fn()),
//     beforeEach: jest.fn() as any,
//     afterAll: jest.fn() as any,
//     afterEach: jest.fn() as any,
//     test: jest.fn() as any,
//     describe: jest.fn() as any,
//   },
// };
// test("config validation", () => {
//   validateConfig(validConfig);
// });

// describe("Config Manager", () => {
//   const config = new ConfigManager(validConfig);
//   describe("get", () => {
//     it("should get a value from the config", () => {
//       expect(config.get("runHooksInsideTests")).toEqual(false);
//     });

//     it("should return undefined for an unknown value", () => {
//       expect(config.get("unknownField")).toBeUndefined();
//     });

//     it("should prioritize overrides", () => {
//       expect(
//         config.get("runHooksInsideTests", { runHooksInsideTests: true })
//       ).toEqual(true);
//     });

//     it("should utilize a fallback", () => {
//       const { runHooksInsideTests: _, ...other } = validConfig;
//       const config = new ConfigManager(other);
//       expect(config.get("runHooksInsideTests", {}, true)).toEqual(true);
//     });
//   });

//   describe("has", () => {
//     it("should return true for a contained value", () => {
//       const { app: _, ...other } = validConfig;
//       const config = new ConfigManager(other);
//       expect(config.has("app", { app: jest.fn() })).toBe(true);
//     });
//     it("should return true for a contained override value", () => {
//       expect(config.has("app")).toBe(true);
//     });
//     it("should return false for an unknown value", () => {
//       expect(config.has("unknownField")).toBe(false);
//     });
//   });
// });
