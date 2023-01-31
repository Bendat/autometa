import { AstBuilder, GherkinClassicTokenMatcher, Parser, compile } from "@cucumber/gherkin";
import { IdGenerator } from "@cucumber/messages";
import { readFileSync } from "fs";

const uuidFn = IdGenerator.uuid();
const builder = new AstBuilder(uuidFn);
const matcher = new GherkinClassicTokenMatcher(); // or Gherkin.GherkinInMarkdownTokenMatcher()

const parser = new Parser(builder, matcher);
const file = readFileSync("./example.feature", "utf-8");
const gherkinDocument = parser.parse(file);
const pickles = compile(gherkinDocument, "uri_of_the_feature.feature", uuidFn);
gherkinDocument.feature;
// console.log(JSON.stringify(gherkinDocument, undefined, 2));
console.log(JSON.stringify(pickles, null, 2));
