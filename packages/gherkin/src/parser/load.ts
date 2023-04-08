import {
  Parser,
  AstBuilder,
  Dialect,
  dialects,
  GherkinClassicTokenMatcher,
} from "@cucumber/gherkin";
import { v4 as uuidv4 } from "uuid";
import { Feature as GherkinFeature } from "@cucumber/messages";
import { convertToClass } from "./parse";

export function parseGherkin(gherkin: string, filePath: string) {
  try {
    const builder = new AstBuilder(uuidv4);
    const matcher = new GherkinClassicTokenMatcher();
    const ast = new Parser(builder, matcher).parse(gherkin);
    if (!ast.feature) {
      throw new Error("No Feature found in AST");
    }
    if (ast.feature?.language !== "en") {
      translateKeywords(ast.feature);
    }
    return convertToClass(ast.feature, filePath);
  } catch (err) {
    const error = err as { message: string };
    error.message = `Error parsing feature Gherkin: ${error.message}`;
    throw err;
  }
}

const translateKeywords = (astFeature: GherkinFeature | undefined) => {
  if (!astFeature) {
    return;
  }
  const languageDialect = dialects[astFeature.language];
  const translationMap = createTranslationMap(languageDialect);

  astFeature.language = "en";
  astFeature.keyword = translationMap[astFeature.keyword] ?? astFeature.keyword;

  for (const child of astFeature.children) {
    if (child.background) {
      child.background.keyword =
        translationMap[child.background.keyword] ?? child.background.keyword;
    }

    if (child.scenario) {
      child.scenario.keyword =
        translationMap[child.scenario.keyword] ?? child.scenario.keyword;

      for (const step of child.scenario.steps) {
        step.keyword = translationMap[step.keyword] ?? step.keyword;
      }

      for (const example of child.scenario.examples) {
        example.keyword = translationMap[example.keyword] ?? example.keyword;
      }
    }
  }

  return astFeature;
};
const createTranslationMap = (translateDialect: Dialect) => {
  const englishDialect = dialects.en;
  const translationMap: { [word: string]: string } = {};

  const props: Array<keyof Dialect> = [
    "and",
    "background",
    "but",
    "examples",
    "feature",
    "scenario",
    "scenarioOutline",
    "given",
    "then",
    "when",
    "rule",
  ];

  for (const prop of props) {
    const dialectWords = translateDialect[prop];
    const translationWords = englishDialect[prop];
    let index = 0;
    let defaultWordIndex: number | null = null;

    for (const dialectWord of dialectWords) {
      if (dialectWord.indexOf("*") !== 0) {
        if (translationWords[index] !== undefined) {
          translationMap[dialectWord] = translationWords[index];
          if (defaultWordIndex === null) {
            defaultWordIndex = index;
          }
        } else {
          if (defaultWordIndex !== null) {
            translationMap[dialectWord] = translationWords[defaultWordIndex];
          } else {
            throw new Error("No translation found for " + dialectWord);
          }
        }
      }

      index++;
    }
  }

  return translationMap;
};
