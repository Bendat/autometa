// import { AllSchemas, ComponentSchema, SwaggerProperty } from "../swagger-request-response.type";

import {
  AllSchemas,
  ComponentSchema,
  SwaggerProperty,
} from "../swagger-request-response.type";

export function transformSchemaByPath(
  path: string,
  schemas: AllSchemas
): SwaggerProperty {
  const componentName = path.replace("#/components/schemas/", "");
  const schema = schemas[componentName];
  return transformSchema(schema, schemas);
}

export function transformSchema(
  schema: ComponentSchema,
  schemas: AllSchemas
) {
  const properties: { [key: string]: SwaggerProperty } = {};
  for (const key in schema.properties) {
    const prop = schema.properties[key];
    if (prop.$ref) {
      properties[key] = transformSchemaByPath(prop.$ref, schemas);
    } else if (prop.items && prop.items.$ref) {
      const transformed = transformSchemaByPath(prop.items.$ref, schemas);
      properties[key] = {
        type: prop.type,
        required: schema.required?.includes(key),
        items: {
          type: transformed.type,
          properties: transformed.properties,
          items: transformed.items,
          required: schema.required?.includes(key),
        },
      };
    } else {
      properties[key] = {
        type: prop.type,
        required: schema.required?.includes(key),
      };
    }
  }

  return {
    type: schema.type,
    properties,
    required: schema.required && schema.required.length > 0,
  };
}
