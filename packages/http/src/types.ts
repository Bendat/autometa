import { StatusCodes } from "@autometa/status-codes";

export type SchemaParser = { parse: <T>(data: T) => T };
export type StatusCode<T extends typeof StatusCodes = typeof StatusCodes> = {
  [P in keyof T]: T[P] extends { status: infer U } ? U : never;
}[keyof T];
