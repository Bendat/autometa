import { describe, it, expect } from "vitest";
import { convertToSwaggerProperty } from "./transform-schema-component";
import { AllSchemas, ComponentSchema } from "../swagger-request-response.type";

describe("convertToSwaggerProperty", () => {
  it('should convert a flat schema to a SwaggerProperty', () => {
    const schema: ComponentSchema = {
      type: 'object',
      properties: {
        prop1: {
          type: 'string',
        },
        prop2: {
          type: 'number',
        },
      },
      required: ['prop1'],
    };
    const allSchemas: AllSchemas = {};
    const result = convertToSwaggerProperty(schema, allSchemas);
    expect(result).toEqual({
      type: 'object',
      properties: {
        prop1: {
          type: 'string',
          required: true,
        },
        prop2: {
          type: 'number',
          required: false,
        },
      },
      required: true,
    });
  })

  it('should convert a component with nested properties to a SwaggerProperty', () => {
    const schema: ComponentSchema = {
      type: 'object',
      properties: {
        prop1: {
          type: 'string',
        },
        prop2: {
          type: 'object',
          properties: {
            nestedProp1: {
              $ref: 'string',
            },
          },
          required: ['nestedProp1'],
        },
      },
      required: ['prop1'],
    };

    const nestedProp1Schema: ComponentSchema = {
      type: 'object',
      properties: {
        nestedProp1: {
          type: 'string',
        },
      },
      required: ['nestedProp1'],
    };
    const allSchemas: AllSchemas = {

    };
    const result = convertToSwaggerProperty(schema, allSchemas);
    expect(result).toEqual({
      type: 'object',
      properties: {
        prop1: {
          type: 'string',
          required: true,
        },
        prop2: {
          type: 'object',
          properties: {
            nestedProp1: {
              type: 'string',
              required: true,
            },
          },
          required: true,
        },
      },
      required: true,
    });
  })
})