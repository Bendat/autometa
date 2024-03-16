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
