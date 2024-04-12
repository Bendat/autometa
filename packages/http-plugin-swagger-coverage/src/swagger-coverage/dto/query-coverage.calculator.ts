import { SwaggerParameter } from "../swagger-request-response.type";

export class QueryParameterCoverageCalculator {
  private referenceParameters: SwaggerParameter[];

  constructor(referenceParameters: SwaggerParameter[]) {
    this.referenceParameters = referenceParameters;
  }

  calculateRequiredCoverage(...allParams: Record<string, unknown>[]) {
    const requiredParameters = new Set(
      this.referenceParameters
        .filter((param) => param.in === "query")
        .filter((param) => param.required)
        .map((param) => param.name)
    );

    const totalRequiredParameters = requiredParameters.size;
    const presentRequiredParameters: string[] = [];
    const missingRequiredParameters: string[] = [];
    const unknownRequiredParameters: string[] = [];

    for (const params of allParams) {
      for (const paramName in params) {
        if (requiredParameters.has(paramName)) {
          presentRequiredParameters.push(paramName);
        }
      }
    }
    
    // get missing required parameters
    for (const param of requiredParameters) {
      if (!presentRequiredParameters.includes(param)) {
        missingRequiredParameters.push(param);
      }
    }

    for (const param of presentRequiredParameters) {
      if (!requiredParameters.has(param)) {
        unknownRequiredParameters.push(param);
      }
    }

    return {
      total: totalRequiredParameters,
      present: new Set(presentRequiredParameters),
      missing: new Set(missingRequiredParameters),
      unknown: new Set(unknownRequiredParameters),
    };
  }

  calculateOptionalCoverage(...allParams: Record<string, unknown>[]) {
    const optionalParameters = new Set(
      this.referenceParameters
        .filter((param) => param.in === "query")
        .filter((param) => !param.required)
        .map((param) => param.name)
    );

    const totalOptionalParameters = optionalParameters.size;
    const presentOptionalParameters: string[] = [];
    const missingOptionalParameters: string[] = [];
    const unknownOptionalParameters: string[] = [];

    // for (const paramName in params) {
    //   if (optionalParameters.has(paramName)) {
    //     presentOptionalParameters.push(paramName);
    //   }
    // }
    for (const params of allParams) {
      for (const paramName in params) {
        if (optionalParameters.has(paramName)) {
          presentOptionalParameters.push(paramName);
        }
      }
    }

    // get missing optional parameters
    for (const param of optionalParameters) {
      if (!presentOptionalParameters.includes(param)) {
        missingOptionalParameters.push(param);
      }
    }

    for (const param of presentOptionalParameters) {
      if (!optionalParameters.has(param)) {
        unknownOptionalParameters.push(param);
      }
    }

    return {
      total: totalOptionalParameters,
      present: new Set(presentOptionalParameters),
      missing: new Set(missingOptionalParameters),
      unknown: new Set(unknownOptionalParameters),
    };
  }
}
