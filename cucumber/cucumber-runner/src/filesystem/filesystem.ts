import glob from "glob";
import path from "path";
import os from "os";
import { readFileSync } from "fs";
import { Config } from "../config/config-manager";

const homeDirectory = os.homedir();
const pathWithTilde = (pathWithTilde: string) => {
  if (typeof pathWithTilde !== "string") {
    throw new TypeError(`Expected a string, got ${typeof pathWithTilde}`);
  }

  return homeDirectory ? pathWithTilde.replace(/^~(?=$|\/|\\)/, homeDirectory) : pathWithTilde;
};
export function getFeatureFile(filePath: string) {
  const file = readFileSync(filePath, "utf-8");
  if (file.length === 0) {
    throw new Error(`Found empty feature file: ${filePath}`);
  }
  return file;
}

export function getRealPath(filePath: string, callerFile: string, isFile = true) {
  const caller = isFile ? path.dirname(callerFile) : callerFile;

  let realPath = filePath;
  if (filePath.startsWith("./") || filePath.startsWith("../")) {
    realPath = path.resolve(caller, filePath);
  } else if (!path.isAbsolute(filePath)) {
    realPath = path.resolve(filePath);
  }
  if (filePath.startsWith("~")) {
    realPath = pathWithTilde(filePath);
  }
  if (filePath.startsWith("^/")) {
    if (!Config.has("featuresRoot")) {
      throw new Error(
        `Cannot have Feature Root pattern (^/path/to/file.feature) if 'featuresRoot' is not set in defineConfig`
      );
    }
    realPath = path.resolve(Config.get("featuresRoot"), filePath.replace("^/", ""));
  }
  return realPath;
}
export function loadGlobalStepFiles() {
  if (Config.has("globalsRoot")) {
    const globalsDirs = Config.get<string>("globalsRoot").replace(/\\/g, "/");
    const resolved = path.resolve(globalsDirs).replace(/\\/g, '/');
    const paths = glob.sync(`${resolved}/**/*.steps.ts`);
    for (const path of paths) {
      require(path.replace(/\\/g, "/"));
    }
  }
}
