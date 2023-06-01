import { TestExecutorConfig } from "../config.schema";
import { FeatureBridge, ScenarioBridge } from "../bridges/bridge";
import { beforeEach, describe, expect, it } from "vitest";
import { ScenarioOutline } from "@autometa/gherkin";
import { App, getApp } from "@autometa/app";
import { EventSubscriber } from "@autometa/events";
import { StatusType } from "@autometa/types";
import { AutomationError } from "@autometa/errors";

describe("group", () => {
  describe("a", () => {
    beforeEach(() => {
      console.log("beforeEach a");
    });
    it("a.1", () => {
      expect(true).toBe(true);
    });
  });

  describe("a", () => {
    beforeEach(() => {
      console.log("beforeEach b");
    });
    it("b.1", () => {
      expect(true).toBe(true);
    });
  });
});
