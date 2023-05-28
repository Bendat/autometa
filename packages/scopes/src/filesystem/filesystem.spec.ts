import { describe, it, expect } from "vitest";
import {
  AbsoluteFileSystem,
  FeatureRootFileSystem,
  Files,
  HomeDirectoryFileSystem,
  RelativeFileSystem,
} from "./filesystem";

describe("FileSystem", () => {
  describe("RelativeFileSystem", () => {
    describe("path", () => {
      it("should return the path relative to the caller", () => {
        const caller = "/home/user/project/src";
        const uri = "features";
        const stepDefRoot = "step_definitions";
        const fs = new RelativeFileSystem(caller, uri, stepDefRoot);
        expect(fs.path).toBe("/home/user/project/src/features");
      });
    });
  });
  describe("HomeDirectoryFileSystem", () => {
    describe("path", () => {
      it("should throw an error when the uri does not start with ~", () => {
        const uri = "features";
        const stepDefRoot = "step_definitions";
        expect(() => new HomeDirectoryFileSystem(uri, stepDefRoot)).toThrow(
          "Cannot use home directory path without ~. Stub was features"
        );
      });

      it("should return the path relative to the home directory", () => {
        const uri = "~/features";
        const stepDefRoot = "step_definitions";
        const fs = new HomeDirectoryFileSystem(uri, stepDefRoot);
        expect(fs.path).toBe("/Users/ben.aherne/features");
      });
    });
  });
  describe("AbsoluteFileSystem", () => {
    describe("path", () => {
      it("should return the absolute path", () => {
        const uri = "/home/user/features";
        const stepDefRoot = "step_definitions";
        const fs = new AbsoluteFileSystem(uri, stepDefRoot);
        expect(fs.path).toBe("/home/user/features");
      });
    });
  });
  describe("FeatureRootFileSystem", () => {
    describe("path", () => {
      describe("when the feature root is not provided", () => {
        it("should throw an error if the feature root is empty", () => {
          const featureRoot = "";
          const uri = "^/my-feature.feature";
          const stepDefRoot = "step_definitions";
          expect(
            () => new FeatureRootFileSystem(featureRoot, uri, stepDefRoot)
          ).toThrowError(
            "Cannot use Feature Root path without feature root. Stub was ^/my-feature.feature"
          );
        });
      });
      it("should throw an error if the feature root is undefined", () => {
        const featureRoot = undefined as unknown as string;
        const uri = "^/my-feature.feature";
        const stepDefRoot = "step_definitions";
        expect(
          () => new FeatureRootFileSystem(featureRoot, uri, stepDefRoot)
        ).toThrowError(
          "Cannot use Feature Root path without feature root. Stub was ^/my-feature.feature"
        );
      });

      it("should return the path relative to the feature root", () => {
        const featureRoot = "/home/user/project/features";
        const uri = "^/my-feature.feature";
        const stepDefRoot = "step_definitions";
        const fs = new FeatureRootFileSystem(featureRoot, uri, stepDefRoot);
        expect(fs.path).toBe("/home/user/project/features/my-feature.feature");
      });
    });
  });
});


describe("Files", () => {
  describe("withFeatureRoot", () => {
    it("should return a new instance of Files with the feature root set", () => {
      const files = new Files();
      const featureRoot = "/home/user/project/features";
      const newFiles = files.withFeatureRoot(featureRoot);
      expect(newFiles.featureRoot).toBe(featureRoot);
      expect(newFiles).toEqual(files);
    });
  });
  
  describe("withCallerFile", () => {
    it("should return a new instance of Files with the caller file set", () => {
      const files = new Files();
      const caller = "/home/user/project/src";
      const newFiles = files.withCallerFile(caller);
      expect(newFiles.callerFile).toBe(caller);
      expect(newFiles).toEqual(files);
    });
  });
  describe("withGlobalRoot", () => {
    it("should return a new instance of Files with the global root set", () => {
      const files = new Files();
      const globalRoot = "/home/user/project";
      const newFiles = files.withGlobalRoot(globalRoot);
      expect(newFiles.stepDefRoot).toBe(globalRoot);
      expect(newFiles).toEqual(files);
    });
  });
  describe("fromUrlPattern", () => {
    it("should return a RelativeFileSystem when the uri is relative ./", () => {
      const files = new Files();
      files.withCallerFile("/home/user/project/src");
      const uri = "./test/login-user.feature";
      const fs = files.fromUrlPattern(uri);
      expect(fs).toBeInstanceOf(RelativeFileSystem);
    });
    it("should return a RelativeFileSystem when the uri is relative ../", () => {
      const files = new Files();
      files.withCallerFile("/home/user/project/src");
      const uri = "../test/login-user.feature";
      const fs = files.fromUrlPattern(uri);
      expect(fs).toBeInstanceOf(RelativeFileSystem);
    });
    it("should return a AbsoluteFileSystem when the uri is absolute", () => {
      const files = new Files();
      const uri = "/test/login-user.feature";
      const fs = files.fromUrlPattern(uri);
      expect(fs).toBeInstanceOf(AbsoluteFileSystem);
    });
    it("should return a HomeDirectoryFileSystem when the uri is a home directory", () => {
      const files = new Files();
      const uri = "~/test/login-user.feature";
      const fs = files.fromUrlPattern(uri);
      expect(fs).toBeInstanceOf(HomeDirectoryFileSystem);
    });
  });
});
