"use strict";(self.webpackChunk_autometa_documentation=self.webpackChunk_autometa_documentation||[]).push([[569],{4993:(e,t,n)=>{n.d(t,{Zo:()=>u,kt:()=>k});var a=n(2983);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},i=Object.keys(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var p=a.createContext({}),s=function(e){var t=a.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},u=function(e){var t=s(e.components);return a.createElement(p.Provider,{value:t},e.children)},d="mdxType",c={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},m=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,i=e.originalType,p=e.parentName,u=l(e,["components","mdxType","originalType","parentName"]),d=s(n),m=r,k=d["".concat(p,".").concat(m)]||d[m]||c[m]||i;return n?a.createElement(k,o(o({ref:t},u),{},{components:n})):a.createElement(k,o({ref:t},u))}));function k(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var i=n.length,o=new Array(i);o[0]=m;var l={};for(var p in t)hasOwnProperty.call(t,p)&&(l[p]=t[p]);l.originalType=e,l[d]="string"==typeof e?e:r,o[1]=l;for(var s=2;s<i;s++)o[s]=n[s];return a.createElement.apply(null,o)}return a.createElement.apply(null,n)}m.displayName="MDXCreateElement"},3523:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>p,contentTitle:()=>o,default:()=>c,frontMatter:()=>i,metadata:()=>l,toc:()=>s});var a=n(3050),r=(n(2983),n(4993));const i={sidebar_position:0},o="Setting Up",l={unversionedId:"cucumber/test_runner/api-testing/setting-up",id:"cucumber/test_runner/api-testing/setting-up",title:"Setting Up",description:"In this tutorial we'll walk through setting up an Autometa based API testing framework in a Typescript project.",source:"@site/docs/cucumber/test_runner/api-testing/setting-up.mdx",sourceDirName:"cucumber/test_runner/api-testing",slug:"/cucumber/test_runner/api-testing/setting-up",permalink:"/autometa/docs/cucumber/test_runner/api-testing/setting-up",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/cucumber/test_runner/api-testing/setting-up.mdx",tags:[],version:"current",sidebarPosition:0,frontMatter:{sidebar_position:0},sidebar:"cucumberRunnerBar",previous:{title:"Hooks",permalink:"/autometa/docs/cucumber/test_runner/hooks"},next:{title:"Configuring Jest",permalink:"/autometa/docs/cucumber/test_runner/api-testing/configuring-jest"}},p={},s=[{value:"Pre Setup",id:"pre-setup",level:2},{value:"Our API",id:"our-api",level:2},{value:"Choose Your test Style",id:"choose-your-test-style",level:2},{value:"Create a Config file",id:"create-a-config-file",level:2},{value:"App",id:"app",level:2},{value:"World",id:"world",level:2},{value:"Env",id:"env",level:2},{value:"Declaration Overrides",id:"declaration-overrides",level:2}],u={toc:s},d="wrapper";function c(e){let{components:t,...n}=e;return(0,r.kt)(d,(0,a.Z)({},u,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"setting-up"},"Setting Up"),(0,r.kt)("p",null,"In this tutorial we'll walk through setting up an Autometa based API testing framework in a Typescript project.\nThe goal of this guide is to end up with a project that can run tests against a local server, or a live\ndeployed service."),(0,r.kt)("p",null,"From Autometa we'll use the following libraries:"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"@autometa/runner")," - Our Cucumber executor, which contains a HTTP Client built on Axios"),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"@autometa/status-codes")," - A collection of HTTP status codes and their descriptions which can be used for assertions."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"@autometa/builder")," - Simply define and create DTOs and Request obects using a builder pattern.")),(0,r.kt)("p",null,"We'll also use some other great libraries:"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://github.com/davidmdm/myzod"},"MyZod"),", ",(0,r.kt)("a",{parentName:"li",href:"https://zod.dev/"},"Zod")," or other schema\nvalidation library you like to validate our API responses and reduce our 'Testing Surface Area'",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},'Schemas let us validate the "shape" of a response. e.g is ',(0,r.kt)("inlineCode",{parentName:"li"},"name")," a ",(0,r.kt)("inlineCode",{parentName:"li"},"string")," and ",(0,r.kt)("inlineCode",{parentName:"li"},"details")," an ",(0,r.kt)("inlineCode",{parentName:"li"},"object"),"?"),(0,r.kt)("li",{parentName:"ul"},"Validators besides MyZod and Zod may require you to write a wrapper to interact with the Autometa HTTP Client, if in use."))),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://www.npmjs.com/package/envalid"},"Envalid")," a schema validator for the\nenvironment variables in our project. You could also make your own with MyZod or Zod.",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"This will parse our ",(0,r.kt)("inlineCode",{parentName:"li"},"process.env")," including values injected from CI Workflows or ",(0,r.kt)("inlineCode",{parentName:"li"},".env")," files."),(0,r.kt)("li",{parentName:"ul"},"Handles type conversion from ",(0,r.kt)("inlineCode",{parentName:"li"},"string")," (only type supported by ",(0,r.kt)("inlineCode",{parentName:"li"},"process.env"),") to ",(0,r.kt)("inlineCode",{parentName:"li"},"number"),", ",(0,r.kt)("inlineCode",{parentName:"li"},"boolean"),", ",(0,r.kt)("inlineCode",{parentName:"li"},"object")," etc."))),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://www.npmjs.com/package/dotenv"},"DotEnv")," to load our environment variables from a ",(0,r.kt)("inlineCode",{parentName:"li"},".env")," file",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"We'll store our API urls and other environment-based or sensitive data in this file (do not commit this file to source control)"))),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://www.npmjs.com/package/reflect-metadata"},"Reflect Metadata")," - To allow us to use decorators in Typescript",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"This requires ",(0,r.kt)("inlineCode",{parentName:"li"},"experimentalDecorators")," and ",(0,r.kt)("inlineCode",{parentName:"li"},"emitDecoratorMetadata")," to be set to ",(0,r.kt)("inlineCode",{parentName:"li"},"true")," in your ",(0,r.kt)("inlineCode",{parentName:"li"},"tsconfig.json")))),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://jestjs.io/"},"Jest")," - At present, Autometa requires Jest as a Test Runner. Future support for Vitest is planned."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://www.npmjs.com/package/ts-jest"},"ts-jest")," - To allow Jest to run Typescript tests"),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://www.npmjs.com/package/ts-node"},"ts-node")," - To allow Jest to run Typescript tests")),(0,r.kt)("p",null,"Optional:"),(0,r.kt)("p",null,"If you prefer the workflow of Axios or node-fetch you can use that as a HTTP client instead."),(0,r.kt)("admonition",{type:"warning"},(0,r.kt)("p",{parentName:"admonition"},"This library requires ",(0,r.kt)("inlineCode",{parentName:"p"},"experimentalDecorators")," and ",(0,r.kt)("inlineCode",{parentName:"p"},"emitDecoratorMetadata")," to be set to ",(0,r.kt)("inlineCode",{parentName:"p"},"true")," in your ",(0,r.kt)("inlineCode",{parentName:"p"},"tsconfig.json"))),(0,r.kt)("h2",{id:"pre-setup"},"Pre Setup"),(0,r.kt)("p",null,"To begin, set up a new Typescript project to your preferred configuration. If starting\nfrom scratch, you can use a project template such as ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/themetalfleece/nodejs-typescript-template"},"this"),"."),(0,r.kt)("p",null,"Configure your jest.config & tsconfig to your liking and install the following dependencies:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"npm i -D @autometa/runner @autometa/status-codes @autometa/builder myzod envalid dotenv\n")),(0,r.kt)("h2",{id:"our-api"},"Our API"),(0,r.kt)("p",null,"For this example we're going to build a framework to test the free ",(0,r.kt)("a",{parentName:"p",href:"https://dummyjson.com/"},"Dummy JSON")," API."),(0,r.kt)("h2",{id:"choose-your-test-style"},"Choose Your test Style"),(0,r.kt)("p",null,"Autometa supports two styles of testing:"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"Gherkin",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"Uses the ",(0,r.kt)("inlineCode",{parentName:"li"},"@autometa/jest-transformer")," to execute Cucumber ",(0,r.kt)("inlineCode",{parentName:"li"},".feature")," files directly in Jest."),(0,r.kt)("li",{parentName:"ul"},"Test Scenarios are assembled automatically by globally defined ",(0,r.kt)("inlineCode",{parentName:"li"},"Step Definitions")," and ",(0,r.kt)("inlineCode",{parentName:"li"},"Hooks"),"."))),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://npmjs.com/package/jest-cucumber"},"Jest-Cucumber Inspired"),(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"Executes code files which reference ",(0,r.kt)("inlineCode",{parentName:"li"},".feature")," files, and support nested Step Definitions,\nand concrete test scenarios.")))),(0,r.kt)("p",null,"For this tutorial we'll use ",(0,r.kt)("inlineCode",{parentName:"p"},"Gherkin")," style."),(0,r.kt)("h2",{id:"create-a-config-file"},"Create a Config file"),(0,r.kt)("p",null,"In the Root of your project, create a file called ",(0,r.kt)("inlineCode",{parentName:"p"},"autometa.config.ts")," and add the following:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-typescript"},'import { defineConfig } from "@autometa/runner";\n\nexport default defineConfig();\n')),(0,r.kt)("p",null,"Next we need to add the following options:"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"runner - The Library or Framework running our tests",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"Currently only ",(0,r.kt)("inlineCode",{parentName:"li"},"jest")," is supported"))),(0,r.kt)("li",{parentName:"ul"},"roots - roots define the roots for important files in our project.",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"features")," - The root of our ",(0,r.kt)("inlineCode",{parentName:"li"},".feature")," files relative to the project root.",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"e.g. ",(0,r.kt)("inlineCode",{parentName:"li"},"$root/integration/features")))),(0,r.kt)("li",{parentName:"ul"},"steps: The root of our ",(0,r.kt)("inlineCode",{parentName:"li"},"Step Definitions")," relative to the project root.",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"e.g. ",(0,r.kt)("inlineCode",{parentName:"li"},"$root/integration/steps")))),(0,r.kt)("li",{parentName:"ul"},'Step Definitions act as "import with side effects". This option is required to ensure they are loaded.\\'),(0,r.kt)("li",{parentName:"ul"},"app: The 'App' is the entry point for our tests and a deviation from Cucumbers default \"World\" concept. It is the file that will be executed by our test runner.",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"e.g. ",(0,r.kt)("inlineCode",{parentName:"li"},"$root/integration/app.ts")),(0,r.kt)("li",{parentName:"ul"},"A class ",(0,r.kt)("inlineCode",{parentName:"li"},"App")," contains our supporting and utility classes via dependency injection."),(0,r.kt)("li",{parentName:"ul"},"A class ",(0,r.kt)("inlineCode",{parentName:"li"},"World")," contains our test state and is passed to each test scenario. Almost identitical to Cucumber's ",(0,r.kt)("inlineCode",{parentName:"li"},"World")," concept."),(0,r.kt)("li",{parentName:"ul"},"(recommended) a ",(0,r.kt)("inlineCode",{parentName:"li"},"env.ts")," file to contain our environment variables and their types using Envalid."))))),(0,r.kt)("li",{parentName:"ul"},"(Optional) shim - an object which can enable or disable shims. Currently only 'Error Causes' is supported.",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"Error Causes - Errors in jest will contain a stack of errors, not just a textual stack trace."),(0,r.kt)("li",{parentName:"ul"},"Not necessary for ecmascript 2022+ as it's now supported natively")))),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-typescript"},'import { defineConfig } from "@autometa/runner";\n\nexport default defineConfig({\n  runner: "jest",\n  roots: {\n    features: "integration/features",\n    steps: "integration/steps",\n    app: "src/app.ts"\n  },\n  shim: {\n    errorCauses: true\n  }\n});\n')),(0,r.kt)("p",null,"Make sure your ",(0,r.kt)("inlineCode",{parentName:"p"},"autometa.config.ts")," is included in your ",(0,r.kt)("inlineCode",{parentName:"p"},"tsconfig file")," under ",(0,r.kt)("inlineCode",{parentName:"p"},"include")," or ",(0,r.kt)("inlineCode",{parentName:"p"},"files"),":"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-json"},'{\n  "include": ["autometa.config.ts"]\n}\n')),(0,r.kt)("h2",{id:"app"},"App"),(0,r.kt)("p",null,"The ",(0,r.kt)("inlineCode",{parentName:"p"},"App")," is our central point of communication within a test. An ",(0,r.kt)("inlineCode",{parentName:"p"},"App")," is a class you define in your Framework\nusing the ",(0,r.kt)("inlineCode",{parentName:"p"},"@AppType")," decorator. ",(0,r.kt)("inlineCode",{parentName:"p"},"AppType")," takes a ",(0,r.kt)("inlineCode",{parentName:"p"},"World")," argument. This is reference to your ",(0,r.kt)("inlineCode",{parentName:"p"},"World")," class."),(0,r.kt)("p",null,"In the official Cucumber implementation, there is no ",(0,r.kt)("inlineCode",{parentName:"p"},"App")," concept. Instead, Cucumber relies on implicit\naccess to the ",(0,r.kt)("inlineCode",{parentName:"p"},"World")," object through the ",(0,r.kt)("inlineCode",{parentName:"p"},"this")," variable. As a result, Cucumber functions must be defined with\n",(0,r.kt)("inlineCode",{parentName:"p"},"function(){}")," syntax, and cannot use ",(0,r.kt)("inlineCode",{parentName:"p"},"(fat)=> 'arrow'")," functions."),(0,r.kt)("p",null,"In Cucumber ",(0,r.kt)("inlineCode",{parentName:"p"},"this")," is bound to the tests ",(0,r.kt)("inlineCode",{parentName:"p"},"World")," object."),(0,r.kt)("p",null,"In Autometa the ",(0,r.kt)("inlineCode",{parentName:"p"},"World")," is defined explicitly, and it is a child of the ",(0,r.kt)("inlineCode",{parentName:"p"},"App"),". Conceptually,\nthe ",(0,r.kt)("inlineCode",{parentName:"p"},"World")," is a state manager. It acts as a way of passing state between steps within a\nScenario's Step Definitions. It is unique between tests but shared between steps."),(0,r.kt)("p",null,"The ",(0,r.kt)("inlineCode",{parentName:"p"},"App")," is a wrapper over the world, which represents state, and other fixtures which handle behavior,\nsuch as HTTP Clients, Database Clients, Page Objects or other utilities."),(0,r.kt)("p",null,"We can add dependencies to the app by creating classes marked with ",(0,r.kt)("inlineCode",{parentName:"p"},"@Fixture"),":"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},'// my-client.ts\n\nimport { Fixture, HTTP } from "@autometa/runner";\n\n@Fixture\nexport class MyClient {\n  constructor(readonly http: HTTP) {\n    this.http.url(Env.API_URL);\n  }\n\n  async getResource() {\n    return await this.http.route("myResource").get();\n  }\n}\n\n// app.ts\n\nimport { AppType } from "@autometa/runner";\nimport { MyClient } from "./my-client";\nimport { World } from "./world";\n\n@AppType(World)\nexport class App {\n  constructor(readonly myClient: MyClient) {}\n}\n')),(0,r.kt)("admonition",{type:"tip"},(0,r.kt)("p",{parentName:"admonition"},(0,r.kt)("inlineCode",{parentName:"p"},"HTTP")," is a built in HTTP client which wraps ",(0,r.kt)("inlineCode",{parentName:"p"},"Axios"),".")),(0,r.kt)("p",null,"The app will be instantiated once per test and will contain a test-specific reference to\na World instance."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},'import { Given } from "@autometa/runner";\nimport { App } from "../app";\n\nWhen("I retrieve the resource", ({ world, myClient }: App) => {\n  world.response = await myClient.getResource();\n});\n')),(0,r.kt)("admonition",{type:"tip"},(0,r.kt)("p",{parentName:"admonition"},"It is not necessary to explicitely define the paramater as ",(0,r.kt)("inlineCode",{parentName:"p"},": APP")," provided you follow the steps ",(0,r.kt)("inlineCode",{parentName:"p"},"Declaration Overrides"),"\nbelow. With overrides, the App is inferred and the World with it")),(0,r.kt)("h2",{id:"world"},"World"),(0,r.kt)("p",null,"World is a Key:Value store represented by a blank class instance. It is automatically\ninjected into the App during tests."),(0,r.kt)("p",null,"Values in the world will persist between"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"Before Hooks"),(0,r.kt)("li",{parentName:"ul"},"After Hooks"),(0,r.kt)("li",{parentName:"ul"},"Scenarion and Scenario Outline Step Definitions"),(0,r.kt)("li",{parentName:"ul"},"Background Step Definitions")),(0,r.kt)("p",null,"Meaning you can set up data in a pretest hook and use it as seed data for your tests.\nWe can declare values on the world which are undefined by default, but are available\nwith their types until the value is filled."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},'import { Fixture, HTTPResponse } from "@autometa/runner";\nimport { MyResourceBody } from "./myclient/myclient.types.ts";\n@Fixture\nexport class World {\n  declare myResourceResponse: HTTPResponse<MyResourceBody>;\n}\n')),(0,r.kt)("h2",{id:"env"},"Env"),(0,r.kt)("p",null,"To set up our environment variables we'll use ",(0,r.kt)("a",{parentName:"p",href:"https://www.npmjs.com/package/envalid"},(0,r.kt)("inlineCode",{parentName:"a"},"Envalid"))," and ",(0,r.kt)("inlineCode",{parentName:"p"},"DotEnv"),"."),(0,r.kt)("p",null,"Create a ",(0,r.kt)("inlineCode",{parentName:"p"},".env")," file in the root of your project and add the following:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-env"},"API_URL=https://dummyapi.io/data/api\n")),(0,r.kt)("p",null,"Next create a file ",(0,r.kt)("inlineCode",{parentName:"p"},"env.ts")," in ",(0,r.kt)("inlineCode",{parentName:"p"},"./src/env")," of your project and add the following:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},'import { cleanEnv, str } from "envalid";\nimport { config } from "dotenv";\n\nconfig();\n\nexport const Env = cleanEnv(process.env, {\n  API_URL: str()\n});\n')),(0,r.kt)("p",null,"Here we defined an ",(0,r.kt)("inlineCode",{parentName:"p"},"API_URL")," which points to our API. This can easily be configured from ",(0,r.kt)("inlineCode",{parentName:"p"},".env")," files,\nor CI/CD workflows."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"// some-file.ts\nconst url = Env.API_URL;\n")),(0,r.kt)("h2",{id:"declaration-overrides"},"Declaration Overrides"),(0,r.kt)("p",null,"Your ",(0,r.kt)("inlineCode",{parentName:"p"},"App"),"/",(0,r.kt)("inlineCode",{parentName:"p"},"World")," classes are unique. No other project has one quite like yours. It's important then\nthat it be declared in a way that is unique to your project. To do this, we'll use a ",(0,r.kt)("inlineCode",{parentName:"p"},"declaration override"),"."),(0,r.kt)("p",null,"Create a new directory ",(0,r.kt)("inlineCode",{parentName:"p"},"__typings__")," and include it as a ",(0,r.kt)("inlineCode",{parentName:"p"},"typeRoot")," in your ",(0,r.kt)("inlineCode",{parentName:"p"},"tsconfig.json"),":"),(0,r.kt)("p",null,"Now that we have our App and World defined, we can declare them to override Autometas empty default interfaces."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-json"},'{\n  "compilerOptions": {\n    "typeRoots": ["./__typings__"]\n  }\n}\n')),(0,r.kt)("p",null,"Next create ",(0,r.kt)("inlineCode",{parentName:"p"},"autometa.d.ts"),", and override Autometas internal ",(0,r.kt)("inlineCode",{parentName:"p"},"App")," and ",(0,r.kt)("inlineCode",{parentName:"p"},"World")," interfaces with your own:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-typescript"},'import { App as MyApp, World as MyWorld } from "../src/app";\n\ndeclare module "@autometa/runner" {\n  interface App extends MyApp {}\n  interface World extends MyWorld {}\n}\n')),(0,r.kt)("p",null,"Steps will now automatically infer the type of the App and World, and it is no longer necessary to\nexplicitely define their type in your Step Definitions."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},'Given("I have a world", ({ world }) => {\n  // world is inferred as MyWorld\n});\n')),(0,r.kt)("p",null,"We can also use these overridden to automatically infer the type of ",(0,r.kt)("a",{parentName:"p",href:"https://cucumber.io/docs/cucumber/cucumber-expressions/"},"Cucumber Expressions"),"."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},'Given("a {builder:product} to add", (product, { world }) => {\n  // product is inferred as ProductBuilder\n  // world is inferred as MyWorld\n  world.productBuilder = product;\n});\n')),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},'// src/app/types.ts\ninterface Types {\n  "builder:product": ProductBuilder;\n}\n')),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},'import type { App as MyApp, World as MyWorld, Types as T } from "../src/app";\nimport type { ProductBuilder } from "../src/product/product.builder";\n\ndeclare module "@autometa/runner" {\n  interface App extends MyApp {}\n  interface World extends MyWorld {}\n  interface Types extends T {}\n}\n')),(0,r.kt)("admonition",{type:"tip"},(0,r.kt)("p",{parentName:"admonition"},"Use the ",(0,r.kt)("inlineCode",{parentName:"p"},"export * from './foo'")," syntax in ",(0,r.kt)("inlineCode",{parentName:"p"},"index.ts")," files to make import your modules more easily.")))}c.isMDXComponent=!0}}]);