// import { AllSchemas, ComponentSchema, SwaggerProperty } from "../swagger-request-response.type";

import {
  ComponentSchema,
  SwaggerProperty,
} from "../swagger-request-response.type";

// // convert ComponentSchema to SwaggerProperty
// export function convertToSwaggerProperty(schema: ComponentSchema, allSchemas: AllSchemas): SwaggerProperty {
//   const properties: { [key: string]: SwaggerProperty } = {};
//   if (schema.properties) {
//     for (const key in schema.properties) {
//       const prop = schema.properties[key];
//       if (prop.$ref) {
//         properties[key] = convertToSwaggerProperty(allSchemas[prop.$ref], allSchemas);
//       } else {
//         properties[key] = {
//           type: prop.type,
//           required: schema?.required?.includes(key),
//         };
//       }
//     }
//   }
//   return {
//     type: schema.type,
//     properties,
//     required: (schema?.required?.length ?? 0) > 0,
//   };
// }

// "schemas": {
//   "ExampleResponseDto": {
//     "type": "object",
//     "properties": {
//       "id": { "type": "string" },
//       "legacyId": { "type": "number" },
//       "name": { "type": "string" },
//       "enabled": { "type": "boolean" },
//       "dateCreated": { "type": "string" }
//     },
//     "required": ["id", "legacyId", "name", "enabled", "dateCreated"]
//   },

export function transformSchemaByPath(
  path: string,
  schemas: {
    components: {
      schemas: {
        [key: string]: ComponentSchema;
      };
    };
  }
): SwaggerProperty {
  const componentName = path.replace("#/components/schemas/", "");
  const schema = schemas.components.schemas[componentName];
  return transformSchema(schema, schemas);
}

export function transformSchema(
  schema: ComponentSchema,
  schemas: { components: { schemas: { [key: string]: ComponentSchema } } }
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
