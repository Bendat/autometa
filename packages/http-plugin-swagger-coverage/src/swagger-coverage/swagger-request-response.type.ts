export interface SwaggerProperty {
  type: string;
  required?: boolean;
  properties?: { [key: string]: SwaggerProperty };
  items?: SwaggerProperty;
}

export interface SwaggerParameter {
  in: "query" | "path" | "header"; // Specifies the location of the parameter (e.g., 'query')
  name: string; // Name of the parameter
  schema: {
    type: string; // Type of the parameter value
  };
  required?: boolean; // Whether the parameter is required (optional)
}

export interface SwaggerEndpoint {
  [key: string]: SwaggerMethod;
}
export interface SwaggerMethod {
  operationId: string;
  summary: string;
  description: string;
  parameters: SwaggerParameter[];
  responses: {
    [key: string]: SwaggerResponse;
  };
  tags: string[];
}

export interface SwaggerResponse {

      description: string;
      content: {
        "application/json": {
          schema?: ComponentSchema;
          "$ref"?: string;
        };
      };
    
}
export type JsonSchemaRoot = {
  schema?: ComponentSchema;
  "$ref"?: string;
}
export type ComponentSchema = {
  type: string;
  properties: {
    [key: string]: {
      type: string;
      $ref?: string;
      items?: {
        $ref: string;
      };
    };
  };
  required?: string[];
};
export type AllSchemas = {
  [key: string]: ComponentSchema;
}
// {
//   "operationId": "ExampleApiController_get",
//   "summary": "Example GET request",
//   "description": "Returns the example object corresponding to the id from the url parameter",
//   "parameters": [
//     {
//       "name": "id",
//       "required": true,
//       "in": "path",
//       "schema": { "type": "number" }
//     }
//   ],
//   "responses": {
//     "200": {
//       "description": "",
//       "content": {
//         "application/json": {
//           "schema": { "$ref": "#/components/schemas/ExampleResponseDto" }
//         }
//       }
//     },
//     "400": {
//       "description": "",
//       "content": {
//         "application/json": {
//           "schema": { "$ref": "#/components/schemas/ErrorMessageDto" }
//         }
//       }
//     }
//   },
//   "tags": ["example"]
// }