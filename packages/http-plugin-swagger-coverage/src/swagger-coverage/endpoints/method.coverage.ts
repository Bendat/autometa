import { SwaggerMethod } from "../swagger-request-response.type";
import { HTTPResponse } from "@autometa/http";
export class SwaggerResponseCoverage {
  #httpCodes: Set<number> = new Set();
  constructor(method: SwaggerMethod) {
    this.#httpCodes = new Set(Object.keys(method.responses).map(Number));
  }

  getCoveredResponses(responses: HTTPResponse[]){
    const coveredCodes = responses.map((response) => response.status);
    const coveredMethods = coveredCodes.filter((code) => this.#httpCodes.has(code));
    const unknownMethods = coveredCodes.filter((code) => !this.#httpCodes.has(code));
    return {
      available: this.#httpCodes,
      covered: new Set(coveredMethods),
      unknown: new Set(unknownMethods),
      coveredResponsePercent: (coveredMethods.length / this.#httpCodes.size) * 100
    };
  }
}