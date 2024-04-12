import { SwaggerParameter } from "../swagger-request-response.type";

export class HeaderParameterCoverageCalculator {
  private referenceParameters: SwaggerParameter[];

  constructor(referenceParameters: SwaggerParameter[]) {
    this.referenceParameters = referenceParameters;
  }

  calculateRequiredCoverage(...allParams: Record<string, unknown>[]) {
    const requiredParameters = new Set(
      this.referenceParameters
        .filter((param) => param.in === "header")
        .filter((param) => param.required)
        .map((param) => param.name)
    );

    const totalRequiredParameters = requiredParameters.size;
    const presentRequiredParameters: string[] = [];
    const missingRequiredParameters: string[] = [];

    // for (const paramName in params) {
    //   if (requiredParameters.has(paramName)) {
    //     presentRequiredParameters.push(paramName);
    //   }
    // }
    for (const params of allParams) {
      for (const paramName in params) {
        if (requiredParameters.has(paramName)) {
          presentRequiredParameters.push(paramName);
        }
      }
    }

    for (const param of requiredParameters) {
      if (!presentRequiredParameters.includes(param)) {
        missingRequiredParameters.push(param);
      }
    }

    return {
      total: totalRequiredParameters,
      present: new Set(presentRequiredParameters),
      missing: new Set(missingRequiredParameters),
    };
  }

  calculateOptionalCoverage(...allParams: Record<string, unknown>[]) {
    const optionalParameters = new Set(
      this.referenceParameters
        .filter((param) => param.in === "header")
        .filter((param) => !param.required)
        .map((param) => param.name)
    );

    const totalOptionalParameters = optionalParameters.size;
    const presentOptionalParameters: string[] = [];
    const missingOptionalParameters: string[] = [];


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

    return {
      total: totalOptionalParameters,
      present: new Set(presentOptionalParameters),
      missing: new Set(missingOptionalParameters),
    };
  }
}
