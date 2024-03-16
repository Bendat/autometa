import { describe, it, expect } from "vitest";
import { SwaggerParameter } from "../swagger-request-response.type";
import { HeaderParameterCoverageCalculator } from "./header-coverage.calculator";
describe("HeaderParameterCoverageCalculator", () => {
  describe("calculateRequiredCoverage", () => {
    it("should return the correct required coverage", () => {
      const referenceParameters: SwaggerParameter[] = [
        {
          in: "header",
          name: "param1",
          schema: {
            type: "string",
          },
          required: true,
        },
        {
          in: "header",
          name: "param2",
          schema: {
            type: "string",
          },
          required: true,
        },
      ];
      const calculator = new HeaderParameterCoverageCalculator(
        referenceParameters
      );
      const params = {
        param1: "value1",
      };
      const result = calculator.calculateRequiredCoverage(params);
      expect(result.total).toBe(2);
      expect(result.present.size).toBe(1);
      expect(result.missing.size).toBe(1);
      expect(result.present.has("param1")).toBe(true);
      expect(result.missing.has("param2")).toBe(true);
    });
  });

  describe("calculateOptionalCoverage", () => {
    it("should return the correct optional coverage", () => {
      const referenceParameters: SwaggerParameter[] = [
        {
          in: "header",
          name: "param1",
          schema: {
            type: "string",
          },
          required: false,
        },
        {
          in: "header",
          name: "param2",
          schema: {
            type: "string",
          },
          required: false,
        },
      ];
      const calculator = new HeaderParameterCoverageCalculator(
        referenceParameters
      );
      const params = {
        param1: "value1",
      };
      const result = calculator.calculateOptionalCoverage(params);
      expect(result.total).toBe(2);
      expect(result.present.size).toBe(1);
      expect(result.missing.size).toBe(1);
      expect(result.present.has("param1")).toBe(true);
      expect(result.missing.has("param2")).toBe(true);
    });
  });
});
