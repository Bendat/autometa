import glob from "glob";
import path from "path";
import os from "os";
import { readFileSync } from "fs";
import { Bind } from "@autometa/bind-decorator";
import { AutomationError } from "@autometa/errors";
import { parseGherkin } from "@autometa/gherkin";

const homeDirectory = os.homedir();
const extensions = [
  ".steps.ts",
  ".given.ts",
  ".when.ts",
  ".then.ts",
  ".hooks.ts",
  ".before.ts",
  ".after.ts",
  ".setup.ts",
  ".teardown.ts",
  ...[
    ".steps.js",
    ".given.js",
    ".when.js",
    ".then.js",
    ".hooks.js",
    ".before.js",
    ".after.js",
    ".setup.js",
    ".teardown.js"
  ]
];
abstract class FileSystem {
  abstract get path(): string | string[];
  declare stepDefRoots: string[];
  declare appRoots: string[];

  getFeatureFile() {
    if (Array.isArray(this.path)) {
      return this.path.map((path) => {
        const text = readFileSync(path, "utf-8");
        return parseGherkin(text, path);
      });
    }
    const text = readFileSync(this.path, "utf-8");
    return parseGherkin(text, this.path);
  }

  loadStepDefinitions() {
    const globalsDirs = this.stepDefRoots;
    if (globalsDirs !== undefined) {
      for (const globalsDir of globalsDirs) {
        const resolved = path.resolve(globalsDir);
        const paths = extensions.flatMap((ext) =>
          glob.sync(`${resolved}/**/*${ext}`)
        );
        for (const path of paths) {
          require(path);
        }
      }
    }
  }
  loadApps() {
    const appDirs = this.appRoots;
    if (appDirs !== undefined) {
      for (const appDir of appDirs) {
        const resolved = path.resolve(appDir);
        const paths = [".ts", ".js"].flatMap((ext) =>
          glob.sync(`${resolved}/**/*${ext}`)
        );
        for (const path of paths) {
          require(path);
        }
      }
    }
  }
}

export class RelativeFileSystem extends FileSystem {
  constructor(
    private caller: string,
    private uri: string,
    readonly stepDefRoots: string[],
    readonly appRoots: string[]
  ) {
    super();
    if (!this.caller) {
      throw new AutomationError(
        `Cannot use relative path without caller file. Stub was ${uri}`
      );
    }
  }
  get path() {
    return path.resolve(this.caller, this.uri.replace(/\\/, "/"));
  }
}
export class HomeDirectoryFileSystem extends FileSystem {
  constructor(
    private uri: string,
    readonly stepDefRoots: string[],
    readonly appRoots: string[]
  ) {
    super();
    if (!uri.startsWith("~")) {
      throw new AutomationError(
        `Cannot use home directory path without ~. Stub was ${uri}`
      );
    }
  }
  get path() {
    return this.uri.replace(/^~(?=$|\/|\\)/, homeDirectory);
  }
}
export class AbsoluteFileSystem extends FileSystem {
  constructor(
    private uri: string,
    readonly stepDefRoots: string[],
    readonly appRoots: string[]
  ) {
    super();
  }
  get path() {
    return this.uri;
  }
}

export class FeatureRootFileSystem extends FileSystem {
  constructor(
    private featureRoot: string[],
    private uri: string,
    readonly stepDefRoots: string[],
    readonly appRoots: string[]
  ) {
    super();
    if (
      this.featureRoot.length == 0 ||
      !Array.isArray(this.featureRoot) ||
      featureRoot.includes(undefined as unknown as string) ||
      featureRoot.includes("") ||
      featureRoot.includes(null as unknown as string)
    ) {
      throw new AutomationError(
        `Cannot use Feature Root path without feature root. Stub was ${uri}`
      );
    }
  }
  get path() {
    return this.featureRoot.map((root) => {
      if (!this.uri.startsWith("^") || !this.uri.startsWith("^/")) {
        throw new AutomationError(
          `Cannot use Feature Root path without feature root. Stub was ${this.uri}. A Feature Root starts with '^' or '^/'`
        );
      }
      const uriReplace = (replacement: string)=>{
        if(this.uri.startsWith("^/")){
          return this.uri.replace("^/", replacement);
        }
        return this.uri.replace("^", replacement);
      }
      
      const uri = uriReplace("").replace(/\\/g, "/");
      const result = path.resolve(root, uri);
      return result;
    });
  }
}
export class Files {
  featureRoot: string[];
  callerFile: string;
  stepDefRoot: string[];
  appRoot: string[];

  @Bind
  withFeatureRoot(featureRoot: string | string[]) {
    if (typeof featureRoot === "string") {
      this.featureRoot = [featureRoot];
      return this;
    }
    this.featureRoot = featureRoot;
    return this;
  }

  @Bind
  withCallerFile(callerFile: string) {
    this.callerFile = callerFile;
    return this;
  }

  @Bind
  withStepsRoot(globalsRootDir: string | string[]) {
    if (typeof globalsRootDir === "string") {
      this.stepDefRoot = [globalsRootDir];
      return this;
    }
    this.stepDefRoot = globalsRootDir;
    return this;
  }
  @Bind
  withAppRoot(appRoot: string | string[]) {
    if (typeof appRoot === "string") {
      this.appRoot = [appRoot];
      return this;
    }
    this.appRoot = appRoot;
    return this;
  }

  @Bind
  fromUrlPattern(uriPattern: string) {
    const global = this.stepDefRoot;
    const apps = this.appRoot;
    if (uriPattern.startsWith("./") || uriPattern.startsWith("../")) {
      return new RelativeFileSystem(this.callerFile, uriPattern, global, apps);
    }
    if (uriPattern.startsWith(".\\") || uriPattern.startsWith("..\\")) {
      return new RelativeFileSystem(this.callerFile, uriPattern, global, apps);
    }
    if (path.isAbsolute(uriPattern)) {
      return new AbsoluteFileSystem(uriPattern, global, apps);
    }
    if (uriPattern.startsWith("~")) {
      return new HomeDirectoryFileSystem(uriPattern, global, apps);
    }
    if (uriPattern.startsWith("^")) {
      return new FeatureRootFileSystem(
        this.featureRoot,
        uriPattern,
        global,
        apps
      );
    }

    // assuming no delimiter. i.e src/lib vs ./src/lib
    return new RelativeFileSystem(this.callerFile, uriPattern, global, apps);
  }
}
