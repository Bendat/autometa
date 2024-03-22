import { AllSchemas, ComponentSchema, SwaggerProperty } from "../swagger-request-response.type";


// convert ComponentSchema to SwaggerProperty
export function convertToSwaggerProperty(schema: ComponentSchema, allSchemas: AllSchemas): SwaggerProperty {
  const properties: { [key: string]: SwaggerProperty } = {};
  if (schema.properties) {
    for (const key in schema.properties) {
      const prop = schema.properties[key];
      if (prop.$ref) {
        properties[key] = convertToSwaggerProperty(allSchemas[prop.$ref], allSchemas);
      } else {
        properties[key] = {
          type: prop.type,
          required: schema?.required?.includes(key),
        };
      }
    }
  }
  return {
    type: schema.type,
    properties,
    required: (schema?.required?.length ?? 0) > 0,
  };
}