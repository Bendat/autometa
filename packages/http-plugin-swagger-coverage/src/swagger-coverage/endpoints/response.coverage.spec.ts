import { describe, it, expect} from 'vitest'
import { SwaggerResponseCoverage } from './response.coverage';
import { SwaggerMethod } from '../swagger-request-response.type';
import { HTTPResponse } from '@autometa/http';
describe("SwaggerResponseCoverage", () => {
  it("should return the correct coverage for a single permitted response", () => {
    const swaggerMethod
     = {
      operationId: "test",
      summary: "test",
      description: "test",
      parameters: [],
      tags: [],
      responses: {
        "200": {
          description: "test",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  prop1: {
                    type: "string",
                  },
                  prop2: {
                    type: "number",
                  },
                },
                required: ["prop1"],
              },
            },
          },
        },
      },
    } as SwaggerMethod;
    const responses: HTTPResponse[] = [
      {
        status: 200,
      } as HTTPResponse,
      {
        status: 400,
      } as HTTPResponse,
    ];
    
    const responseCoverage = new SwaggerResponseCoverage(swaggerMethod);
    const coverage = responseCoverage.getCoveredResponses(responses);
    expect(coverage.available.size).toBe(1);
    expect(coverage.covered.size).toBe(1);
    expect(coverage.unknown.size).toBe(1);
    expect(coverage.coveredResponsePercent).toBe(100);
  });

  it('should return with 50% coverage', ()=>{
    const swaggerMethod = {
      operationId: "test",
      summary: "test",
      description: "test",
      parameters: [],
      tags: [],
      responses: {
        "200": {
          description: "test",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  prop1: {
                    type: "string",
                  },
                  prop2: {
                    type: "number",
                  },
                },
                required: ["prop1"],
              },
            },
          },
        },
        '400': {
          description: "test",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  prop1: {
                    type: "string",
                  },
                  prop2: {
                    type: "number",
                  },
                },
                required: ["prop1"],
              },
            },
          },
        }
      },
    } as SwaggerMethod;
    const responses: HTTPResponse[] = [
      {
        status: 200,
      } as HTTPResponse,
    ];
    
    const responseCoverage = new SwaggerResponseCoverage(swaggerMethod);
    const coverage = responseCoverage.getCoveredResponses(responses);
    expect(coverage.available.size).toBe(2);
    expect(coverage.covered.size).toBe(1);
    expect(coverage.unknown.size).toBe(0);
    expect(coverage.coveredResponsePercent).toBe(50);
  })
})