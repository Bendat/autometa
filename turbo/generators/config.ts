import type { PlopTypes } from "@turbo/gen";
import _ from "lodash";
export default function (plop: PlopTypes.NodePlopAPI) {
  plop.setGenerator("library", {
    description: "creates a new build-able, publishable library",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "What is the name of the library?",
      },
      {
        type: "input",
        name: "description",
        message: "What is the description of the library?",
      },
      {
        type: "list",
        name: "root",
        message: "What is the root of the library?",
        choices: ["packages", "libraries", "__integration__"],
      },
    ],
    actions: [
      {
        type: "add",
        path: "{{root}}/{{kebabCase name}}/package.json",
        templateFile: "plop-templates/library/package.json.hbs",
      },
      {
        type: "add",
        path: "{{root}}/{{kebabCase name}}/tsup.config.ts",
        templateFile: "plop-templates/library/tsup.config.ts.hbs",
      },
      {
        type: "add",
        path: "{{root}}/{{kebabCase name}}/vitest.config.ts",
        templateFile: "plop-templates/library/vitest.config.ts.hbs",
      },
      {
        type: "add",
        path: "{{root}}/{{kebabCase name}}/tsconfig.json",
        templateFile: "plop-templates/library/tsconfig.json.hbs",
      },
      {
        type: "add",
        path: "{{root}}/{{kebabCase name}}/tsconfig.types.json",
        templateFile: "plop-templates/library/tsconfig.types.json.hbs",
      },
      {
        type: "add",
        path: "{{root}}/{{kebabCase name}}/README.md",
        templateFile: "plop-templates/library/README.md.hbs",
      },
      {
        type: "add",
        path: "{{root}}/{{kebabCase name}}/LICENSE",
        templateFile: "plop-templates/library/LICENSE.hbs",
      },
      {
        type: "add",
        path: "{{root}}/{{kebabCase name}}/.npmignore",
        templateFile: "plop-templates/library/.npmignore.hbs",
      },
      {
        type: "add",
        path: "{{root}}/{{kebabCase name}}/.eslintrc.cjs",
        templateFile: "plop-templates/library/.eslintrc.cjs.hbs",
      },
      {
        type: "add",
        path: "{{root}}/{{kebabCase name}}/.eslintignore",
        templateFile: "plop-templates/library/.eslintignore.hbs",
      },
      {
        type: "add",
        path: "{{root}}/{{kebabCase name}}/src/index.ts",
        templateFile: "plop-templates/library/src/index.ts.hbs",
      },
    ],
  });
}
