import { SwaggerProperty } from "../swagger-request-response.type";

interface PropertyMatchResult {
  readonly expected: Set<string>;
  readonly present: Set<string>;
  readonly missing: Set<string>;
  readonly unknown: Set<string>;
  readonly total: number;
}

/**
 * Generates result lists for the properties of a DTO (request or response) body
 * schema, with the following meanings:
 * - expected: properties that are required by the schema explicitly
 * - present: properties that are present across all known request or response DTOs
 * - missing: properties that are required by the schema but are not present in any known request or response DTO
 * - unknown: properties that are present in known request or response DTOs but are not required by the schema
 *      - This will have false positives until filtered against optional properties
 */
export class DTORequiredPropertyCoverageCalculator {
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
        if (currentSchema.required) {
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
        if (prop.required) {
          result.missing.add(currentKeyPath);
          result.expected.add(currentKeyPath);
          if (prop.type === "object" || prop.type === "array") {
            addAllProperties(prop, [...currentPath, key]);
          }
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

    // Check each DTO against the schema
    for (const dto of dtos) {
      if (
        !this.referenceSchema.properties &&
        this.referenceSchema.type !== "object" &&
        this.referenceSchema.type !== "array"
      ) {
        const currentPath = [...path].join(".");
        result.present.add(currentPath);
        continue;
      }
      const schema = this.referenceSchema;
      if ("additionalProperties" in schema) {
        schema.properties = schema.additionalProperties?.properties;
      }
      for (const key in schema.properties) {
        const prop = schema.properties[key];
        if (!prop.required) continue;
        const currentPath = [...path, key].join(".");
        if (dto !== null && typeof dto === "object" && key in dto) {
          result.present.add(currentPath);
          if (prop.type === "object" && typeof dto[key] === "object") {
            const calculator = new DTORequiredPropertyCoverageCalculator(prop);
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
          result.present.add(currentPath);
          const calculator = new DTORequiredPropertyCoverageCalculator(
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
          const calculator = new DTORequiredPropertyCoverageCalculator(
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

    return {
      ...result,
      total: result.present.size + result.missing.size,
    };
  }
}
