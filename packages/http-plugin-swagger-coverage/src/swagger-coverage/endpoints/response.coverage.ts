import {
  ComponentSchema,
  SwaggerMethod,
  SwaggerResponse,
} from "../swagger-request-response.type";
import { HTTPResponse } from "@autometa/http";
import { DTORequiredPropertyCoverageCalculator } from "../dto/required-property-coverage.calculator";
import { DTOOptionalPropertyCoverageCalculator } from "../dto/optional-property-coverage.calculator";
import { transformSchema, transformSchemaByPath } from "../transform/transform-schema-component";
export class SwaggerResponseCoverage {
  #httpCodes: Set<number> = new Set();
  constructor(method: SwaggerMethod) {
    this.#httpCodes = new Set(Object.keys(method.responses).map(Number));
  }

  getCoveredResponses(responses: HTTPResponse[]) {
    const coveredCodes = responses.map((response) => response.status);
    const coveredMethods = coveredCodes.filter((code) =>
      this.#httpCodes.has(code)
    );
    const unknownMethods = coveredCodes.filter(
      (code) => !this.#httpCodes.has(code)
    );
    return {
      available: this.#httpCodes,
      covered: new Set(coveredMethods),
      unknown: new Set(unknownMethods),
      coveredResponsePercent:
        (coveredMethods.length / this.#httpCodes.size) * 100,
    };
  }

  getResponseCoverage(
    httpCode: number,
    responseSchema: SwaggerResponse,
    responses: HTTPResponse[],
    schemas: {
      components: {
        schemas: {
          [key: string]: ComponentSchema;
        };
      };
    }
  ) {
    const relevantResponses = responses.filter(
      (response) => response.status === httpCode
    );
    const schema = responseSchema.content["application/json"];
    if (!schema.schema && !schema.$ref) {
      return;
    }

    if (schema?.schema?.type !== "object" && schema.schema?.type !== "array") {
      const presenceOf = relevantResponses.find((response) => response.data);
      const absenceOf = relevantResponses.find((response) => !response.data);
      return {
        value: {
          presenceOf,
          absenceOf,
          coverage:
            presenceOf && absenceOf
              ? 100
              : presenceOf
              ? 50
              : absenceOf
              ? 50
              : 0,
        },
      };
    }
    if (schema.$ref) {
      const property = transformSchemaByPath(schema.$ref, schemas);
      const responseBodyCoverageCalculatorRequired =
        new DTORequiredPropertyCoverageCalculator(property);
      const required =
        responseBodyCoverageCalculatorRequired.matchSwaggerPropertyToDTO(
          relevantResponses
        );

      const responseBodyCoverageCalculatorOptional =
        new DTOOptionalPropertyCoverageCalculator(property);
      const optional =
        responseBodyCoverageCalculatorOptional.matchSwaggerPropertyToDTO(
          relevantResponses
        );
      return {
        required,
        optional,
      };
    }

    if(schema.schema) {
      const property = transformSchema(schema.schema, schemas);
      const responseBodyCoverageCalculatorRequired =
        new DTORequiredPropertyCoverageCalculator(property);
      const required =
        responseBodyCoverageCalculatorRequired.matchSwaggerPropertyToDTO(
          relevantResponses
        );

      const responseBodyCoverageCalculatorOptional =
        new DTOOptionalPropertyCoverageCalculator(property);
      const optional =
        responseBodyCoverageCalculatorOptional.matchSwaggerPropertyToDTO(
          relevantResponses
        );
      return {
        required,
        optional,
      };
    }

    return {
      required: {
        present: new Set(),
        missing: new Set(),
        unknown: new Set(),
        total: 100
      },
      optional: {
        present: new Set(),
        missing: new Set(),
        unknown: new Set(),
        total: 100
      }
    }
  }
}
