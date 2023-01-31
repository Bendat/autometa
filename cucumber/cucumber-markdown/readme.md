# Getting Started

Autometa Cucumber-Markdown can convert your Cucumber `.feature` files
to beautiful markdown for your documentation sites like Vercel or Docusuaurus.

## Install

**As a global command**

```sh title=NPM
npm i -D @autometa/dto-builder
```

 ```sh title=Yarn
 yarn add -D @autometa/dto-builder
 ```

```sh title=PNPM
pnpm i -D @autometa/dto-builder
```

# Use

```sh
$ cucumber-markdown ./inputDir ./outputDir
```

File globs are supported e.g `**/*.feature`

Options:
```sh
  -v, --verbose <boolean>    If true, logs show files being read and written
                             (default: false)
  -f, --flatten <boolean>    If true, flattens output directory 
                             structure to a depth of 1 
                             (default: false)
  -o, --overwrite <boolean>  If true, overwrites existing markdown files (default:
                             true)
  -h, --help                 display help for command
```