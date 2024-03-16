import { SwaggerProperty } from "../swagger-request-response.type";

export class DTOCoverageCalculator {
  private referenceSchema: SwaggerProperty;

  constructor(referenceSchema: SwaggerProperty) {
    this.referenceSchema = referenceSchema;
  }

  calculateCoveragePercentage(dto: any): {
    mandatory: number;
    optional: number;
  } {
    const { mandatoryCount, totalMandatoryProperties } =
      this.calculateMandatoryCoverage(dto, this.referenceSchema);
    const totalOptionalProperties = this.calculateOptionalCoverage(
      dto,
      this.referenceSchema
    );

    const mandatoryCoverage =
      totalMandatoryProperties === 0
        ? 0
        : (mandatoryCount / totalMandatoryProperties) * 100;
    const optionalCoverage =
      totalOptionalProperties === 0
        ? 0
        : ((Object.keys(dto).length - mandatoryCount) /
            totalOptionalProperties) *
          100;

    return { mandatory: mandatoryCoverage, optional: optionalCoverage };
  }

  private calculateMandatoryCoverage(
    dto: any,
    referenceSchema: SwaggerProperty
  ): { mandatoryCount: number; totalMandatoryProperties: number } {
    let mandatoryCount = 0;
    const totalMandatoryProperties =
      this.calculateTotalMandatoryProperties(referenceSchema);

    for (const key in referenceSchema.properties) {
      const prop = referenceSchema.properties[key];
      if (prop.required && key in dto) {
        mandatoryCount++;
        if (
          (prop.type === "object" && dto[key] === null) ||
          dto[key] === undefined
        ) {
          // NOOP
          continue;
        }
        if (prop.type === "object" && typeof dto[key] === "object") {
          // If the property is an object, recursively count its mandatory properties
          const subDto = dto[key]; // Use empty object if property is not provided
          const subCoverage = this.calculateMandatoryCoverage(subDto, prop);
          mandatoryCount += subCoverage.mandatoryCount;
        }
      }
    }

    return { mandatoryCount, totalMandatoryProperties };
  }

  calculateTotalMandatoryProperties(referenceSchema: SwaggerProperty): number {
    let totalMandatoryProperties = 0;

    for (const key in referenceSchema.properties) {
      if (referenceSchema.properties[key].required) {
        totalMandatoryProperties++;

        if (referenceSchema.properties[key].type === "object") {
          totalMandatoryProperties += this.calculateTotalMandatoryProperties(
            referenceSchema.properties[key]
          );
        }
      }
    }

    return totalMandatoryProperties;
  }
}
