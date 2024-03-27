import { SwaggerProperty } from "../swagger-request-response.type";

interface PropertyMatchResult {
  readonly expected: Set<string>;
  readonly present: Set<string>;
  readonly missing: Set<string>;
  readonly unknown: Set<string>;

  readonly total: number;
}

export class DTOOptionalPropertyCoverageCalculator {
  private referenceSchema: SwaggerProperty;

  constructor(referenceSchema: SwaggerProperty) {
    this.referenceSchema = referenceSchema;
  }

  matchSwaggerPropertyToDTO(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dtos: any[],
    path: string[] = []
  ): PropertyMatchResult {
    const result = {
      expected: new Set<string>(),
      present: new Set<string>(),
      missing: new Set<string>(),
      unknown: new Set<string>(),
    };

    // Add all properties from the schema to the missing set
    const addAllProperties = (
      currentSchema: SwaggerProperty,
      currentPath: string[]
    ) => {
      if (!currentSchema.properties && currentSchema.type !== "object") {
        if (!currentSchema.required) {
          const currentKeyPath = [...currentPath].join(".");
          currentKeyPath && result.missing.add(currentKeyPath);
          currentKeyPath && result.expected.add(currentKeyPath);
        }
      }
      if (currentSchema.type === "array") {
        addAllProperties(currentSchema.items as SwaggerProperty, [
          ...currentPath,
          `[]`,
        ]);
      }
      for (const key in currentSchema.properties) {
        const prop = currentSchema.properties[key];
        const currentKeyPath = [...currentPath, key].join(".");
        if (!prop.required) {
          currentKeyPath && result.missing.add(currentKeyPath);
          currentKeyPath && result.expected.add(currentKeyPath);
        }
        if (prop.type === "object" || prop.type === "array") {
          addAllProperties(prop, [...currentPath, key]);
        }
      }
      if ("additionalProperties" in currentSchema) {
        addAllProperties(
          currentSchema.additionalProperties as SwaggerProperty,
          [...currentPath]
        );
      }
    };

    addAllProperties(this.referenceSchema, path);

    for (const dto of dtos) {
      const schema = this.referenceSchema;

      if (
        !schema.properties &&
        schema.type !== "object" &&
        schema.type !== "array"
      ) {
        const currentPath = [...path].join(".");
        result.present.add(currentPath);
        continue;
      }
      if ("additionalProperties" in schema) {
        schema.properties = schema.additionalProperties?.properties;
      }
      for (const key in schema.properties) {
        const prop = schema.properties[key];
        const currentPath = [...path, key].join(".");
        if (dto !== null && typeof dto === "object" && key in dto) {
          if (!prop.required) {
            result.present.add(currentPath);
          }
          if (prop.type === "object" && typeof dto[key] === "object") {
            const calculator = new DTOOptionalPropertyCoverageCalculator(prop);
            const nestedResult = calculator.matchSwaggerPropertyToDTO(
              [dto[key]],
              [...path, key]
            );
            nestedResult.present.forEach((p) => result.present.add(p));
            nestedResult.missing.forEach((m) => result.missing.add(m));
            nestedResult.unknown.forEach((u) => result.unknown.add(u));
          }
        }
        if (prop.type === "array" && Array.isArray(dto[key])) {
          if (!prop.required) {
            result.present.add(currentPath);
          }
          const calculator = new DTOOptionalPropertyCoverageCalculator(
            prop as SwaggerProperty
          );
          const nestedResult = calculator.matchSwaggerPropertyToDTO(
            [dto[key]],
            [...path, key]
          );
          nestedResult.present.forEach((p) => result.present.add(p));
          nestedResult.missing.forEach((m) => result.missing.add(m));
          nestedResult.unknown.forEach((u) => result.unknown.add(u));
        }
        if (prop.type !== "object" && typeof dto !== "object") {
          result.present.add(currentPath);
        }
      }
      if (schema.type === "array" && Array.isArray(dto)) {
        for (let i = 0; i < dto.length; i++) {
          const calculator = new DTOOptionalPropertyCoverageCalculator(
            schema.items as SwaggerProperty
          );

          const nestedResult = calculator.matchSwaggerPropertyToDTO(
            [dto[i]],
            [...path, "[]"]
          );

          nestedResult.present.forEach((p) => result.present.add(p));
          nestedResult.missing.forEach((m) => result.missing.add(m));
        }
      }

      for (const presentKey of result.present) {
        result.missing.delete(presentKey);
      }

      if (schema.type === "array") {
        continue;
      }
      // Check for unknown properties in the DTO
      for (const dtoKey in dto) {
        if (!(dtoKey in (this.referenceSchema.properties ?? {}))) {
          result.unknown.add([...path, dtoKey].join("."));
        }
      }
    }
    // Add all properties from the present set to the unknown set
    result.present.forEach((key) => {
      if (!result.expected.has(key)) {
        result.unknown.add(key);
      }
    });

    return {
      ...result,
      total: result.present.size + result.missing.size,
    };
  }
}
