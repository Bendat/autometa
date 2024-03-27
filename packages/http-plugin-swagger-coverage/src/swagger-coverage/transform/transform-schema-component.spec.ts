import { describe, it, expect } from "vitest";
import { transformSchemaByPath } from "./transform-schema-component";
import { AllSchemas, ComponentSchema } from "../swagger-request-response.type";

describe("convertToSwaggerProperty", () => {
  it("should convert a flat schema to a SwaggerProperty", () => {
    const allSchemas = {
      components: {
        schemas: {
          ExampleResponseDto: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              enabled: { type: "boolean" },
              dateCreated: { type: "string" },
            },
            required: ["id", "legacyId", "name", "enabled", "dateCreated"],
          },
        },
      },
    };

    const result = transformSchemaByPath(
      "#/components/schemas/ExampleResponseDto",
      allSchemas
    );
    expect(result).toEqual({
      type: "object",
      required: true,
      properties: {
        id: {
          type: "string",
          required: true,
        },
        name: {
          type: "string",
          required: true,
        },
        enabled: {
          type: "boolean",
          required: true,
        },
        dateCreated: {
          type: "string",
          required: true,
        },
      },
    });
  });

  it("should transform a schema with a referenced sub-component", () => {
    const allSchemas = {
      components: {
        schemas: {
          ExampleResponseDto: {
            type: "object",
            properties: {
              id: { type: "string" },
              nested: { $ref: "#/components/schemas/NestedDto" },
            },
            required: ["id", "nested"],
          },
          NestedDto: {
            type: "object",
            properties: {
              name: { type: "string" },
            },
            required: ["name"],
          },
        },
      },
    };

    const result = transformSchemaByPath(
      "#/components/schemas/ExampleResponseDto",
      allSchemas
    );
    expect(result).toEqual({
      type: "object",
      required: true,
      properties: {
        id: {
          type: "string",
          required: true,
        },
        nested: {
          type: "object",
          required: true,
          properties: {
            name: {
              type: "string",
              required: true,
            },
          },
        },
      },
    });
  });

  it("should transform a schema with an array", () => {
    const allSchemas = {
      components: {
        schemas: {
          ExampleResponseDto: {
            type: "object",
            properties: {
              id: { type: "string" },
              array: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/NestedDto",
                },
              },
            },
            required: ["id", "nested", "array"],
          },
          NestedDto: {
            type: "object",
            properties: {
              name: { type: "string" },
            },
            required: ["name"],
          },
        },
      },
    };

    const result = transformSchemaByPath(
      "#/components/schemas/ExampleResponseDto",
      allSchemas
    );
    expect(result).toEqual({
      type: "object",
      required: true,
      properties: {
        id: {
          type: "string",
          required: true,
        },
        array: {
          type: "array",
          required: true,
          items: {
            type: "object",
            required: true,
            properties: {
              name: {
                type: "string",
                required: true,
              },
            },
          },
        },
      },
    });
  });

  it('should ')
});