import { def, fallback, overloads, string } from "@autometa/overloaded";
import { ParamTypeDefinition } from "./parameters";
import { Dates } from "@autometa/datetime";
import { AssertIs } from "@autometa/asserters";
import { DateTime } from "luxon";
type AutoParamTypeDefinition = Omit<ParamTypeDefinition, "transform">;
const strNum = /['"]-?\d+['"]/;

const isodateRegexp =
  /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;
const shortDateRegex =
  /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\d)/;
const boolTypesActive = ["active", "inactive"];
const boolTypesEnabled = ["enabled", "disabled"];
const boolTypes = ["true", "false"];

export const NumberParam: AutoParamTypeDefinition = {
  name: "number",
  regexpPattern: /\d+/,
  primitive: Number
};

export const AnyParam: AutoParamTypeDefinition = {
  name: "any",
  regexpPattern: /.*/
};
export const UnknownParam: AutoParamTypeDefinition = {
  name: "unknown",
  regexpPattern: /.*/
};
export const TextParam: ParamTypeDefinition = {
  name: "text",
  regexpPattern: /"([^"\\]*(\\.[^"\\]*)*)"|'([^'\\]*(\\.[^'\\]*)*)'/,
  primitive: String,
  transform: (value: string) => {
    const asStr = value as string;
    return asStr.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  }
};

export const BooleanParam: AutoParamTypeDefinition = {
  name: "boolean",
  regexpPattern: /true|false/,
  primitive: Boolean
};
export const BoolParam: AutoParamTypeDefinition = {
  name: "bool",
  regexpPattern: /true|false/,
  primitive: Boolean
};
export const DateParam: AutoParamTypeDefinition = {
  name: "date",
  regexpPattern: [isodateRegexp, shortDateRegex],
  type: Date
};

export const PrimitiveParam: ParamTypeDefinition = {
  name: "primitive",
  regexpPattern: [
    /true|false/,
    /enabled|disabled/,
    /active|inactive/,
    /null/,
    /empty/,
    /undefined|missing/,
    /NaN/,
    /Infinity/,
    /-Infinity/,
    isodateRegexp,
    shortDateRegex,
    /-?(\d*\.?\d+|\d{1,3}(,\d{3})*(\.\d+)?)/, // Comma delimited number, e.g. "1", "1,000", "1,000.00"
    /-?(\d*,?\d+|\d{1,3}(.\d{3})*(,\d+))/, // Period delimited number, e.g. "1", "1.000,00"
    /"([^"]*)"/,
    /'([^']*)'/
  ],
  transform: (value: unknown) => {
    return overloads(
      def(string({ equals: "null" })).matches((_) => null),
      def(string({ in: ["undefined", "missing"] })).matches((_) => undefined),
      def(string({ in: boolTypes })).matches((val) => Boolean(val)),
      def(string({ equals: "NaN" })).matches((_) => NaN),
      def(string({ equals: "Infinity" })).matches((_) => Infinity),
      def(string({ equals: "-Infinity" })).matches((_) => -Infinity),
      def(string({ pattern: isodateRegexp })).matches(parseIso),
      def(string({ pattern: shortDateRegex })).matches(parseDate),
      def(string({ pattern: strNum })).matches(trimQuotes),
      def(
        string({ pattern: /-?(\d{1,3}(,\d{3})*(\.\d+)?)/})
      ).matches((val) => {
        const asStr = val.replace(/,/g, "");
        return parseFloat(asStr);
      }),
      // def(string({ pattern: /-?(\d{1,3}(\.\d{3})*(,\d+)?)/ })).matches(
      //   (val) =>{
      //     const asStr = val.replace(/\./g, "").replace(/,/g, ".");
      //     return Number(asStr);
      //   }
      // ),
      def(string({ in: boolTypesEnabled })).matches(boolEnabled),
      def(string({ in: boolTypesActive })).matches(boolActive),
      fallback((val) => {
        AssertIs(val, "string");
        const fromPhrase = Dates.fromPhrase(val);
        if (fromPhrase && !isNaN(fromPhrase.getTime())) {
          return fromPhrase;
        }
        return val.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
      })
    ).use([value]);
  }
};

function boolActive(val: string): boolean {
  return val === "active";
}

function boolEnabled(val: string): boolean {
  return val === "enabled";
}

function parseDate(val: string): Date {
  return new Date(Date.parse(val));
}

function trimQuotes(val: string): string {
  return val.slice(1, -1);
}

function parseIso(val: string): Date {
  return DateTime.fromISO(val).toJSDate();
}
