# Getting Started

Autometa Cucumber-Markdown can convert your Cucumber `.feature` files
to beautiful markdown for your documentation sites like Vercel or Docusuaurus.

The output is not necessarily compatible with gherkin markdown files
which can be used to run tests.

## Install

**As a global command**

```sh title=NPM
npm i -D @autometa/cucumber-markdown
```

 ```sh title=Yarn
 yarn add -D @autometa/cucumber-markdown
 ```

```sh title=PNPM
pnpm i -D @autometa/cucumber-markdown
```

# Use

```sh
$ cucumber-markdown ./inputDir ./outputDir
```


Options:
```sh
  -v, --verbose <boolean>    If true, logs show files being read and written
                             (default: false)
  -f, --flatten <boolean>    If true, flattens output directory 
                             structure to a depth of 1 
                             (default: false)
  -o, --overwrite <boolean>  If true, overwrites existing markdown files (default:
                             true)
  -c  --collapse <boolean>   If true, files with the same feature name will be collapsed
                             into a single file
  -h, --help                 display help for command
```