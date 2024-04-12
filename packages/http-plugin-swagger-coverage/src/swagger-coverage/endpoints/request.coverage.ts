import { AllSchemas, SwaggerMethod } from "../swagger-request-response.type";
import { HTTPRequest, HTTPResponse } from "@autometa/http";
import { transformSchema } from "../transform/transform-schema-component";
import { matchPath, matchPathByRegex } from "./path.parser";
import { DTORequiredPropertyCoverageCalculator } from "../dto/required-property-coverage.calculator";
import { DTOOptionalPropertyCoverageCalculator } from "../dto/optional-property-coverage.calculator";
import { QueryParameterCoverageCalculator } from "../dto/query-coverage.calculator";
import { HeaderParameterCoverageCalculator } from "../dto/header-coverage.calculator";
export class SwaggerRequestCoverage {
  constructor(
    private readonly route: string,
    private readonly method: SwaggerMethod,
    private readonly allSchemas: AllSchemas,
    private readonly options: {
      ignoreHeaderByMatch: RegExp[];
      ignoreRouteByMatch: RegExp[];
      ignoreRoute: string[];
      ignoreHeader: string[];
    }
  ) {}

  getRequestBodyCoverage(responses: HTTPResponse[]) {
    const paths = this.route.split("/");
    const ignoreRouteByRegExpFilter = (it: HTTPRequest<unknown>) =>
      matchPathByRegex(it.route, this.options.ignoreRouteByMatch);
    const ignoreRouteByExactMatchFilter = (it: HTTPRequest<unknown>) =>
      matchPath(it.route, this.options.ignoreRoute);
    const requests = responses
      .map((response) => response.request)
      .filter((it) => matchPath(it.route, paths))
      .filter(ignoreRouteByRegExpFilter)
      .filter(ignoreRouteByExactMatchFilter)
      .filter((it) => it.method === this.method.operationId);
    const property = transformSchema(
      this.method.requestBody.content["application/json"].schema,
      this.allSchemas
    );
    const requiredProperties = new DTORequiredPropertyCoverageCalculator(
      property
    );
    const optionalProperties = new DTOOptionalPropertyCoverageCalculator(
      property
    );
    const required = requiredProperties.matchSwaggerPropertyToDTO(requests);
    const optional = optionalProperties.matchSwaggerPropertyToDTO(requests);
    return { required, optional };
  }

  getParameterCoverage(responses: HTTPResponse[]) {
    const paths = this.route.split("/");
    const requests = responses
      .map((response) => response.request)
      .filter((it) => matchPath(it.route, paths))
      .filter((it) => it.method === this.method.operationId)
      .map((it) => it.params);
    const query = new QueryParameterCoverageCalculator(this.method.parameters);
    const header = new HeaderParameterCoverageCalculator(
      this.method.parameters
    );
    const queryResultsRequired = header.calculateRequiredCoverage(...requests);
    const queryResultsOptional = header.calculateOptionalCoverage(...requests);

    const headerResultsRequired = query.calculateRequiredCoverage(...requests);
    const headerResultsOptional = query.calculateOptionalCoverage(...requests);

    return {
      query: {
        required: queryResultsRequired,
        optional: queryResultsOptional,
      },
      header: {
        required: headerResultsRequired,
        optional: headerResultsOptional,
      },
    };
  }
}
