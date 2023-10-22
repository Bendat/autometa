import { StatusCodes } from "@autometa/status-codes";

export type SchemaParser = { parse: (data: unknown) => unknown };
export type StatusCode<T extends typeof StatusCodes = typeof StatusCodes> = {
  [P in keyof T]: T[P] extends { status: infer U } ? U : never;
}[keyof T];
