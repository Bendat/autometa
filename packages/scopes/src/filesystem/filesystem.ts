import glob from "glob";
import path from "path";
import os from "os";
import { readFileSync } from "fs";
import { Bind } from "@autometa/bind-decorator";
import { AutomationError } from "src/automation-error";
import { parseGherkin } from "@autometa/gherkin";

const homeDirectory = os.homedir();

abstract class FileSystem {
  abstract get path(): string;
  declare stepDefRoot: string;

  getFeatureFile() {
    const text = readFileSync(this.path, "utf-8");
    return parseGherkin(text, this.path);
  }

  loadStepDefinitions() {
    const globalsDirs = this.stepDefRoot;
    if (globalsDirs !== undefined) {
      const resolved = path.resolve(globalsDirs);
      const paths = [
        ...glob.sync(`${resolved}/**/*.steps.ts`),
        ...glob.sync(`${resolved}/**/*.hooks.ts`),
      ];
      for (const path of paths) {
        require(path);
      }
    }
  }
}
export class RelativeFileSystem extends FileSystem {
  constructor(
    private caller: string,
    private uri: string,
    readonly stepDefRoot: string
  ) {
    super();
    if (!this.caller) {
      throw new AutomationError(
        `Cannot use relative path without caller file. Stub was ${uri}`
      );
    }
  }
  get path() {
    return path.resolve(this.caller, this.uri);
  }
}
export class HomeDirectoryFileSystem extends FileSystem {
  constructor(private uri: string, readonly stepDefRoot: string) {
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
  constructor(private uri: string, readonly stepDefRoot: string) {
    super();
  }
  get path() {
    return this.uri;
  }
}

export class FeatureRootFileSystem extends FileSystem {
  constructor(
    private featureRoot: string,
    private uri: string,
    readonly stepDefRoot: string
  ) {
    super();
    if (!this.featureRoot) {
      throw new AutomationError(
        `Cannot use Feature Root path without feature root. Stub was ${uri}`
      );
    }
  }
  get path() {
    return path.resolve(this.featureRoot, this.uri.replace("^/", ""));
  }
}
export class Files {
  featureRoot: string;
  callerFile: string;
  stepDefRoot: string;

  @Bind
  withFeatureRoot(featureRoot: string) {
    this.featureRoot = featureRoot;
    return this;
  }
  @Bind
  withCallerFile(callerFile: string) {
    this.callerFile = callerFile;
    return this;
  }
  @Bind
  withGlobalRoot(globalsRootDir: string) {
    this.stepDefRoot = globalsRootDir;
    return this;
  }
  @Bind
  fromUrlPattern(uriPattern: string) {
    const global = this.stepDefRoot;
    if (uriPattern.startsWith("./") || uriPattern.startsWith("../")) {
      return new RelativeFileSystem(this.callerFile, uriPattern, global);
    }
    if (path.isAbsolute(uriPattern)) {
      return new AbsoluteFileSystem(uriPattern, global);
    }
    if (uriPattern.startsWith("~")) {
      return new HomeDirectoryFileSystem(uriPattern, global);
    }
    if (uriPattern.startsWith("^/")) {
      return new FeatureRootFileSystem(this.featureRoot, uriPattern, global);
    }

    throw new AutomationError(
      `Could not find a strategy for ${uriPattern}. Ensure it is a valid file path`
    );
  }
}
