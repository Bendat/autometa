import { beforeEach, describe, it, expect } from "vitest";
import { DTORequiredPropertyCoverageCalculator } from "./required-property-coverage.calculator";
import { SwaggerProperty } from "../swagger-request-response.type";

describe("DTORequiredPropertyCoverageCalculator", () => {
  const referenceSchema: SwaggerProperty = {
    type: "object",
    properties: {
      prop1: { type: "string", required: true },
      prop2: {
        type: "object",
        required: true,
        additionalProperties: {
          type: "object",
          required: true,
          properties: {
            subprop1: { type: "string", required: true },
            subprop2: { type: "string" }, // optional property
          },
        },
      },
      prop3: { type: "string" }, // optional property
    },
  };
  let calculator: DTORequiredPropertyCoverageCalculator;

  beforeEach(() => {
    calculator = new DTORequiredPropertyCoverageCalculator(referenceSchema);
  });

  it("Should match properties for single DTO with all mandatory properties", () => {
    const dto = {
      prop1: "value1",
      prop2: {
        subprop1: "value2",
      },
    };

    const result = calculator.matchSwaggerPropertyToDTO([dto]);

    expect(result.present).toHaveLength(3);
    expect(result.present.has("prop1")).toBeTruthy();
    expect(result.present.has("prop2")).toBeTruthy();
    expect(result.present.has("prop2.subprop1")).toBeTruthy();
  });

  it("Should match properties for single DTO with missing mandatory properties", () => {
    const dto = {
      prop1: "value1",
    };

    const result = calculator.matchSwaggerPropertyToDTO([dto]);

    expect(result.present.size).toBe(1);
    expect(result.present.has("prop1")).toBeTruthy();
    expect(result.missing.size).toBe(2);
    expect(result.missing.has("prop2")).toBeTruthy();
    expect(result.missing.has("prop2.subprop1")).toBeTruthy();
  });

  it("should match properties for a single DTO with an empty mandatory object", () => {
    const dto = {
      prop1: "value1",
      prop2: {},
    };

    const result = calculator.matchSwaggerPropertyToDTO([dto]);

    expect(result.present.size).toBe(2);
    expect(result.present.has("prop1")).toBeTruthy();
    expect(result.present.has("prop2")).toBeTruthy();
    expect(result.missing.size).toBe(1);
    expect(result.missing.has("prop2.subprop1")).toBeTruthy();
  });

  it("should match properties for a single DTO which are not known to swagger", () => {
    const dto = {
      prop1: "value1",
      unknownProp1: "value2",
      prop2: {
        subprop1: "value2",
        subUnknownProp: "value3",
      },
    };

    const result = calculator.matchSwaggerPropertyToDTO([dto]);

    expect(result.unknown.size).toBe(2);
    expect(result.unknown.has("unknownProp1")).toBeTruthy();
    expect(result.unknown.has("prop2.subUnknownProp")).toBeTruthy();
  });

  it("should match a DTO which is simply a string", () => {
    const schema: SwaggerProperty = {
      type: "string",
      required: true,
    };
    const dto = "string";
    const result = new DTORequiredPropertyCoverageCalculator(
      schema
    ).matchSwaggerPropertyToDTO([dto]);
    expect(result.present.size).toBe(1);
  });

  it("should match a DTO with a nested string", () => {
    const schema: SwaggerProperty = {
      type: "object",
      properties: {
        prop1: {
          type: "string",
          required: true,
        },
      },
    };
    const dto = {
      prop1: "string",
    };
    const result = new DTORequiredPropertyCoverageCalculator(
      schema
    ).matchSwaggerPropertyToDTO([dto]);
    expect(result.present.size).toBe(1);
  });

  it("should match a DTO with a missing nested string", () => {
    const schema: SwaggerProperty = {
      type: "object",
      properties: {
        prop1: {
          type: "string",
          required: true,
        },
      },
    };
    const dto = {};
    const result = new DTORequiredPropertyCoverageCalculator(
      schema
    ).matchSwaggerPropertyToDTO([dto]);
    expect(result.present.size).toBe(0);
    expect(result.missing.size).toBe(1);
    expect(result.missing).toContain("prop1");
  });

  it("should match the properties against multiple DTOs", () => {
    const dtos = [
      {
        prop1: "value1",
        prop2: {
          subprop1: "value2",
        },
      },
      {
        prop1: "value1",
      },
      {
        prop1: "value1",
        prop2: {},
      },
      {
        prop1: "value1",
        unknownProp1: "value2",
        prop2: {
          subprop1: "value2",
          subUnknownProp: "value3",
        },
      },
    ];
    const result = calculator.matchSwaggerPropertyToDTO(dtos);
    expect(result.present.size).toBe(3);
    expect(result.missing.size).toBe(0);
    expect(result.unknown.size).toBe(2);
    expect(result.present).toContain("prop1");
    expect(result.present).toContain("prop2");
    expect(result.present).toContain("prop2.subprop1");
    expect(result.unknown).toContain("unknownProp1");
    expect(result.unknown).toContain("prop2.subUnknownProp");
    expect([...result.expected]).toEqual(["prop1", "prop2", "prop2.subprop1"]);
  });

  it("should match missing properties in an array item", () => {
    const schema: SwaggerProperty = {
      type: "array",
      required: true,
      items: {
        type: "object",
        properties: {
          prop1: {
            type: "string",
            required: true,
          },
        },
      },
    };

    const dto = [{ prop1: "value1" }];

    const result = new DTORequiredPropertyCoverageCalculator(
      schema
    ).matchSwaggerPropertyToDTO([dto]);
    expect(result.present.size).toBe(1);
    expect([...result.present]).toEqual(["[].prop1"]);
    expect(result.missing.size).toBe(0);
    expect(result.unknown.size).toBe(0);
    expect(result.expected.size).toBe(1);
    expect([...result.expected]).toEqual(["[].prop1"]);
  });

  it("should match the properties in a nested array", () => {
    const schema: SwaggerProperty = {
      type: "object",
      properties: {
        prop1: {
          type: "string",
          required: true,
        },
        prop2: {
          type: "array",
          required: true,
          items: {
            type: "object",
            properties: {
              subprop1: {
                type: "string",
                required: true,
              },
              subprop2: {
                type: "string",
                required: true,
              },
            },
          },
        },
      },
    };

    const dto = {
      prop1: "value1",
      prop2: [
        {
          subprop1: "value2",
          subprop2: "value3",
        },
      ],
    };

    const result = new DTORequiredPropertyCoverageCalculator(
      schema
    ).matchSwaggerPropertyToDTO([dto]);
    expect(result.present.size).toBe(4);
  });

  it("should ignore a non mandatory array", () => {
    const schema: SwaggerProperty = {
      type: "array",
      items: {
        type: "object",
        properties: {
          subprop1: {
            type: "string",
          },
          subprop2: {
            type: "string",
          },
        },
      },
    };

    const dto = [
      {
        subprop1: "value2",
        subprop2: "value3",
      },
    ];

    const result = new DTORequiredPropertyCoverageCalculator(
      schema
    ).matchSwaggerPropertyToDTO([dto]);
    expect(result.expected.size).toBe(0);
    expect(result.present.size).toBe(0);
    expect(result.missing.size).toBe(0);
  });

  it("should ignore a nested non mandatory array", () => {
    const schema: SwaggerProperty = {
      type: "object",
      properties: {
        prop1: {
          type: "array",
          items: {
            type: "object",
            properties: {
              subprop1: {
                type: "string",
              },
              subprop2: {
                type: "string",
              },
            },
          },
        },
      },
    };

    const dto = {
      prop1: "value1",
      prop2: [
        {
          subprop1: "value2",
          subprop2: "value3",
        },
      ],
    };

    const result = new DTORequiredPropertyCoverageCalculator(
      schema
    ).matchSwaggerPropertyToDTO([dto]);
    expect(result.present.size).toBe(0);
    expect(result.expected.size).toBe(0);
    expect(result.missing.size).toBe(0);
  });

  describe("full example", () => {
    const schema: SwaggerProperty = {
      type: "object",
      properties: {
        prop1: {
          type: "string",
          required: true,
        },
        prop2: {
          type: "array",
          required: true,
          items: {
            type: "object",
            properties: {
              subprop1: {
                type: "string",
                required: true,
              },
              subprop2: {
                type: "string",
                required: true,
              },
            },
          },
        },
      },
    };

    it("should match a full example", () => {
      const dtos = [
        {
          prop1: "value1",
          prop2: [
            {
              subprop1: "value2",
              subprop2: "value3",
            },
            {
              subprop1: "value4",
              subprop2: "value5",
            },
          ],
        },
        {
          prop1: "value1",
          prop2: [
            {
              subprop1: "value2",
              subprop2: "value3",
            },
          ],
        },
        {
          prop1: "value1",
          prop2: [
            {
              subprop1: "value2",
            },
          ],
        },
      ];
      const result = new DTORequiredPropertyCoverageCalculator(
        schema
      ).matchSwaggerPropertyToDTO(dtos);
      expect(result.present.size).toBe(4);
      expect(result.missing.size).toBe(0);
      expect(result.unknown.size).toBe(0);
      expect([...result.present]).toEqual([
        "prop1",
        "prop2",
        "prop2.[].subprop1",
        "prop2.[].subprop2",
      ]);
      expect([...result.expected]).toEqual([
        "prop1",
        "prop2",
        "prop2.[].subprop1",
        "prop2.[].subprop2",
      ]);
    });
  });
});
