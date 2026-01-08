#! node
import storage from "node-persist";
import path from "path";
import { cwd } from "process";
import "./testrail";
import { prompt } from "enquirer";
import { addFeatureToSuite } from "./testrail";
import os from "os";
storage.init();

const tempDir = path.join(os.tmpdir(), "testrail-cucumber");

const store = storage.create({ dir: tempDir });
store.init();
type dict<T> = Record<string, T>;
let loadedFeaturePath: string | undefined = undefined;
async function run() {
  if (process.argv.includes("--clearAll")) {
    await store.clear();
  }
  if (process.argv[2]?.endsWith(".feature")) {
    loadedFeaturePath = process.argv[2];
  }

  const url = await urlPrompt(store);
  const username = await usernamePrompt(store);
  const password = await passwordPrompt(store);
  let featurePath = await pathPrompt();
  const projectId = await projectIdPrompt();
  const suiteId = await suiteIdPrompt();
  if (!path.isAbsolute(featurePath)) {
    featurePath = path.resolve(process.cwd(), featurePath);
  }
  const options = {
    username,
    password,
    url,
  };

  let uri: string = featurePath.trim();

  if (path.isAbsolute(uri)) {
    uri = path.resolve(cwd(), uri);
  }

  await addFeatureToSuite(uri, projectId, parseInt(suiteId), options);
  const again = await doAnotherPrompt();
  if (again) {
    await run();
  } else {
    console.log("done");
  }
}

run();

async function suiteIdPrompt() {
  return (
    await prompt<Record<string, string>>([
      {
        type: "input",
        name: "suiteId",
        message: "SuiteId (leave empty to create new)",
      },
    ])
  )["suiteId"];
}
let projectId: number | undefined = undefined;
async function projectIdPrompt() {
  if (projectId) {
    return projectId;
  }
  const givenId = (
    (await prompt({
      type: "input",
      name: "projectId",
      message: "ProjectId",
    })) as dict<string>
  )["projectId"];
  projectId = parseInt(givenId);
  return projectId;
}

async function pathPrompt() {
  if (loadedFeaturePath) {
    const temp = loadedFeaturePath;
    loadedFeaturePath = undefined;
    return temp;
  }
  return (
    (await prompt({
      type: "input",
      name: "featurePath",
      message: "Path to feature file",
    })) as dict<string>
  )["featurePath"];
}

async function urlPrompt(store: storage.LocalStorage) {
  const existingUrl = await store.getItem("testrail-cucumber:url");
  if (!existingUrl) {
    const url = (await prompt({
      type: "input",
      name: "testRailUrl",
      message: "Test Rails Url",
    })) as dict<string>;
    await store.setItem("testrail-cucumber:url", url["testRailUrl"]);
  }
  const url = await store.getItem("testrail-cucumber:url");
  return url;
}

async function usernamePrompt(store: storage.LocalStorage) {
  const usernameKey = "testrail-cucumber:username";
  const existingusername = await store.getItem(usernameKey);
  if (!existingusername) {
    const url = (await prompt([
      {
        type: "input",
        name: "testRailUsername",
        message: "Test Rails Username",
      },
    ])) as dict<string>;
    await store.setItem(usernameKey, url["testRailUsername"]);
  }
  const username = await store.getItem(usernameKey);
  return username;
}

async function passwordPrompt(store: storage.LocalStorage) {
  const passwordKey = "testrail-cucumber:password";
  const existingpassword = await store.getItem(passwordKey);
  if (!existingpassword) {
    const answer = (await prompt([
      {
        type: "password",
        name: "testRailPassword",

        message: "Test Rails Password",
      },
    ])) as dict<string>;

    const password = answer["testRailPassword"];
    await store.setItem(passwordKey, password);
  }
  const password = await store.getItem(passwordKey);
  return password;
}

async function doAnotherPrompt() {
  return (
    await prompt<Record<string, string>>([
      {
        type: "confirm",
        name: "doAnother",
        message: "Do Another?",
      },
    ])
  )["doAnother"];
}
