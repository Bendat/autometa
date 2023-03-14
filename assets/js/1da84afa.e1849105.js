"use strict";(self.webpackChunk_autometa_documentation=self.webpackChunk_autometa_documentation||[]).push([[4226],{7522:(e,t,n)=>{n.d(t,{Zo:()=>c,kt:()=>f});var r=n(9901);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function s(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?s(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):s(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},s=Object.keys(e);for(r=0;r<s.length;r++)n=s[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);for(r=0;r<s.length;r++)n=s[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var i=r.createContext({}),u=function(e){var t=r.useContext(i),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},c=function(e){var t=u(e.components);return r.createElement(i.Provider,{value:t},e.children)},p="mdxType",d={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},m=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,s=e.originalType,i=e.parentName,c=l(e,["components","mdxType","originalType","parentName"]),p=u(n),m=a,f=p["".concat(i,".").concat(m)]||p[m]||d[m]||s;return n?r.createElement(f,o(o({ref:t},c),{},{components:n})):r.createElement(f,o({ref:t},c))}));function f(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var s=n.length,o=new Array(s);o[0]=m;var l={};for(var i in t)hasOwnProperty.call(t,i)&&(l[i]=t[i]);l.originalType=e,l[p]="string"==typeof e?e:a,o[1]=l;for(var u=2;u<s;u++)o[u]=n[u];return r.createElement.apply(null,o)}return r.createElement.apply(null,n)}m.displayName="MDXCreateElement"},9814:(e,t,n)=>{n.d(t,{Z:()=>o});var r=n(9901),a=n(4517);const s={tabItem:"tabItem_yFNy"};function o(e){let{children:t,hidden:n,className:o}=e;return r.createElement("div",{role:"tabpanel",className:(0,a.Z)(s.tabItem,o),hidden:n},t)}},8919:(e,t,n)=>{n.d(t,{Z:()=>w});var r=n(4321),a=n(9901),s=n(4517),o=n(9603),l=n(6172),i=n(7072),u=n(5656),c=n(9714);function p(e){return function(e){return a.Children.map(e,(e=>{if((0,a.isValidElement)(e)&&"value"in e.props)return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))}(e).map((e=>{let{props:{value:t,label:n,attributes:r,default:a}}=e;return{value:t,label:n,attributes:r,default:a}}))}function d(e){const{values:t,children:n}=e;return(0,a.useMemo)((()=>{const e=t??p(n);return function(e){const t=(0,u.l)(e,((e,t)=>e.value===t.value));if(t.length>0)throw new Error(`Docusaurus error: Duplicate values "${t.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[t,n])}function m(e){let{value:t,tabValues:n}=e;return n.some((e=>e.value===t))}function f(e){let{queryString:t=!1,groupId:n}=e;const r=(0,l.k6)(),s=function(e){let{queryString:t=!1,groupId:n}=e;if("string"==typeof t)return t;if(!1===t)return null;if(!0===t&&!n)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return n??null}({queryString:t,groupId:n});return[(0,i._X)(s),(0,a.useCallback)((e=>{if(!s)return;const t=new URLSearchParams(r.location.search);t.set(s,e),r.replace({...r.location,search:t.toString()})}),[s,r])]}function b(e){const{defaultValue:t,queryString:n=!1,groupId:r}=e,s=d(e),[o,l]=(0,a.useState)((()=>function(e){let{defaultValue:t,tabValues:n}=e;if(0===n.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(t){if(!m({value:t,tabValues:n}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${t}" but none of its children has the corresponding value. Available values are: ${n.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return t}const r=n.find((e=>e.default))??n[0];if(!r)throw new Error("Unexpected error: 0 tabValues");return r.value}({defaultValue:t,tabValues:s}))),[i,u]=f({queryString:n,groupId:r}),[p,b]=function(e){let{groupId:t}=e;const n=function(e){return e?`docusaurus.tab.${e}`:null}(t),[r,s]=(0,c.Nk)(n);return[r,(0,a.useCallback)((e=>{n&&s.set(e)}),[n,s])]}({groupId:r}),g=(()=>{const e=i??p;return m({value:e,tabValues:s})?e:null})();(0,a.useLayoutEffect)((()=>{g&&l(g)}),[g]);return{selectedValue:o,selectValue:(0,a.useCallback)((e=>{if(!m({value:e,tabValues:s}))throw new Error(`Can't select invalid tab value=${e}`);l(e),u(e),b(e)}),[u,b,s]),tabValues:s}}var g=n(933);const h={tabList:"tabList_IriV",tabItem:"tabItem_L6E7"};function y(e){let{className:t,block:n,selectedValue:l,selectValue:i,tabValues:u}=e;const c=[],{blockElementScrollPositionUntilNextRender:p}=(0,o.o5)(),d=e=>{const t=e.currentTarget,n=c.indexOf(t),r=u[n].value;r!==l&&(p(t),i(r))},m=e=>{let t=null;switch(e.key){case"Enter":d(e);break;case"ArrowRight":{const n=c.indexOf(e.currentTarget)+1;t=c[n]??c[0];break}case"ArrowLeft":{const n=c.indexOf(e.currentTarget)-1;t=c[n]??c[c.length-1];break}}t?.focus()};return a.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,s.Z)("tabs",{"tabs--block":n},t)},u.map((e=>{let{value:t,label:n,attributes:o}=e;return a.createElement("li",(0,r.Z)({role:"tab",tabIndex:l===t?0:-1,"aria-selected":l===t,key:t,ref:e=>c.push(e),onKeyDown:m,onClick:d},o,{className:(0,s.Z)("tabs__item",h.tabItem,o?.className,{"tabs__item--active":l===t})}),n??t)})))}function v(e){let{lazy:t,children:n,selectedValue:r}=e;if(n=Array.isArray(n)?n:[n],t){const e=n.find((e=>e.props.value===r));return e?(0,a.cloneElement)(e,{className:"margin-top--md"}):null}return a.createElement("div",{className:"margin-top--md"},n.map(((e,t)=>(0,a.cloneElement)(e,{key:t,hidden:e.props.value!==r}))))}function k(e){const t=b(e);return a.createElement("div",{className:(0,s.Z)("tabs-container",h.tabList)},a.createElement(y,(0,r.Z)({},e,t)),a.createElement(v,(0,r.Z)({},e,t)))}function w(e){const t=(0,g.Z)();return a.createElement(k,(0,r.Z)({key:String(t)},e))}},6985:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>i,default:()=>f,frontMatter:()=>l,metadata:()=>u,toc:()=>p});var r=n(4321),a=(n(9901),n(7522)),s=n(8919),o=n(9814);const l={sidebar_position:1},i="Introduction",u={unversionedId:"cucumber/test_runner/intro",id:"cucumber/test_runner/intro",title:"Introduction",description:"Autometa Cucumber Runner is a wrapper for multiple established",source:"@site/docs/cucumber/test_runner/intro.mdx",sourceDirName:"cucumber/test_runner",slug:"/cucumber/test_runner/intro",permalink:"/autometa/docs/cucumber/test_runner/intro",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/cucumber/test_runner/intro.mdx",tags:[],version:"current",sidebarPosition:1,frontMatter:{sidebar_position:1},sidebar:"cucumberRunnerBar",next:{title:"Steps",permalink:"/autometa/docs/cucumber/test_runner/steps"}},c={},p=[{value:"Features",id:"features",level:2},{value:"Install",id:"install",level:2},{value:"Quick Start",id:"quick-start",level:2},{value:"Configure",id:"configure",level:3},{value:"Use",id:"use",level:3}],d={toc:p},m="wrapper";function f(e){let{components:t,...n}=e;return(0,a.kt)(m,(0,r.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"introduction"},"Introduction"),(0,a.kt)("p",null,"Autometa Cucumber Runner is a wrapper for multiple established\ntest runners like ",(0,a.kt)("a",{parentName:"p",href:"https://jestjs.io/"},"jest")," and ",(0,a.kt)("a",{parentName:"p",href:"https://vitest.dev/"},"vitest")," that enables support for testing ",(0,a.kt)("inlineCode",{parentName:"p"},".feature")," files."),(0,a.kt)("h2",{id:"features"},"Features"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},"Utilize you or your teams favorite testing framework with Cucumber"),(0,a.kt)("li",{parentName:"ul"},"Steps are defined globally and scenarios are self assembling"),(0,a.kt)("li",{parentName:"ul"},"Steps can be overridden for specific features or scenarios with edge behavior"),(0,a.kt)("li",{parentName:"ul"},"Per-Scenario dependency injection of tester-defined classes."),(0,a.kt)("li",{parentName:"ul"},"Cucumber expressions"),(0,a.kt)("li",{parentName:"ul"},"Extensive handling of data tables")),(0,a.kt)("h2",{id:"install"},"Install"),(0,a.kt)(s.Z,{mdxType:"Tabs"},(0,a.kt)(o.Z,{value:"npm",label:"NPM",mdxType:"TabItem"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre"},"npm add -D @autometa/cucumber-runner\n"))),(0,a.kt)(o.Z,{value:"yarn",label:"YARN",mdxType:"TabItem"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre"},"yarn add -D @autometa/cucumber-runner\n"))),(0,a.kt)(o.Z,{value:"pnpm",label:"PNPM",mdxType:"TabItem"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre"},"pnpm add -D @autometa/cucumber-runner\n")))),(0,a.kt)("h2",{id:"quick-start"},"Quick Start"),(0,a.kt)("h3",{id:"configure"},"Configure"),(0,a.kt)("p",null,"To begin, add ",(0,a.kt)("inlineCode",{parentName:"p"},"*.feature.ts")," as a test file pattern to your\ntest library config if needed. Also, add ",(0,a.kt)("inlineCode",{parentName:"p"},"autometa.config.ts"),"\nto the setup files option"),(0,a.kt)(s.Z,{mdxType:"Tabs"},(0,a.kt)(o.Z,{value:"vitest",label:"Vitest",mdxType:"TabItem"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-js",metastring:"title='vitest.config.js'",title:"'vitest.config.js'"},"import { defineConfig } from 'vitest/config'\n\ndefineConfig({\n  ...\n  setupFiles: ['autometa.config.ts']\n  include: ['**/*.{test,spec,feature}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']\n  ...\n})\n\n"))),(0,a.kt)(o.Z,{value:"jest",label:"Jest",mdxType:"TabItem"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-js",metastring:"title='jest.config.js'",title:"'jest.config.js'"},"export default {\n  ...\n  setupFilesAfterEnv: ['autometa.config.ts']\n  testMatch: ['**/?(*.)+(spec|test|feature).[jt]s?(x)']\n  ...\n}\n")))),(0,a.kt)("p",null,"Next, create the ",(0,a.kt)("inlineCode",{parentName:"p"},"autometa.config.ts"),". To use globally available\nstep files, add a ",(0,a.kt)("inlineCode",{parentName:"p"},"globals")," option, and provide the test functions\nof your test framework. It's also a good idea to import ",(0,a.kt)("inlineCode",{parentName:"p"},"reflect-metadata"),"\nfrom this file. ",(0,a.kt)("inlineCode",{parentName:"p"},"reflect-metadata")," is a required dependency of this library."),(0,a.kt)(s.Z,{mdxType:"Tabs"},(0,a.kt)(o.Z,{value:"vitest",label:"Vitest",mdxType:"TabItem"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'import "reflect-metadata";\nimport { defineConfig } from "@autometa/cucumber-runner";\nimport {\n  describe,\n  test,\n  beforeEach,\n  beforeAll,\n  afterEach,\n  afterAll,\n} from "vitest";\n\ndefineConfig({\n  globals: "globals",\n  runner: {\n    name: "vitest",\n    describe,\n    test,\n    beforeEach,\n    beforeAll,\n    afterEach,\n    afterAll,\n  },\n});\n'))),(0,a.kt)(o.Z,{value:"jest",label:"Jest",mdxType:"TabItem"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'import "reflect-metadata";\nimport { defineConfig } from "@autometa/cucumber-runner";\n\ndefineConfig({\n  globals: "globals",\n  runner: {\n    name: "jest",\n    describe,\n    test,\n    beforeEach,\n    beforeAll,\n    afterEach,\n    afterAll,\n  },\n});\n')))),(0,a.kt)("h3",{id:"use"},"Use"),(0,a.kt)(s.Z,{mdxType:"Tabs"},(0,a.kt)(o.Z,{value:"gherkin",label:"Gherkin",mdxType:"TabItem"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-gherkin",metastring:"title='<project-root>/features/my-feature.feature'",title:"'<project-root>/features/my-feature.feature'"},"Feature: A User Can Log In\n  Background: Set up a new User\n    Given a new registered User\n      | username | name | age | password |\n      | johnny5  | John | 45  | paS5091! |\n\n  Scenario: A User logs in with valid credentials\n    When they log in\n     | username | password |\n     | johnny5  | paS5091! |\n    Then they see their profile\n\n  Scenario: A User logs in with a bad password\n      When they log in\n     | username | password |\n     | johnny5  | oops     |\n    Then they are informed their password is incorrect\n"))),(0,a.kt)(o.Z,{value:"ts",label:"Typescript",mdxType:"TabItem"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts",metastring:"title='<project-root>/tests/my-feature.feature.ts'",title:"'<project-root>/tests/my-feature.feature.ts'"},'import {\n  Given,\n  When,\n  Then,\n  Feature,\n  Before,\n  Scenario,\n} from "@autometa/cucumber-runner";\nimport { App } from "../src/app";\n\nBefore("Launch browser", async ({ world, myDriver }) => {\n  world.page = await myDriver.start(process.env.API_URL);\n});\n\nGiven(\n  "a new registered User",\n  async (data: HTable, { world, httpClient }: App) => {\n    const userDetails = data.json(0);\n    await httpClient.createUser(userDetails);\n  }\n);\n\nWhen("they log in", async (userDetails: HTable, { world: { page } }: App) => {\n  const { username, password } = userDetails.json(0);\n  await page.logUserIn(username, password);\n});\n\nThen("they see their profile", async ({ world: { page } }: App) => {\n  await page.verifyProfileOpen();\n});\n\nThen(\n  "they are informed their {word} is incorrect",\n  async (field: string, { world: { page } }: App) => {\n    await page.verifyBadLoginField(field);\n  }\n);\n\nFeature("../features/my-feature.feature");\n\n// override Steps\n\nFeature(() => {\n  Given(\n    "a new registered User",\n    async (data: HTable, { world: { page } }: App) => {\n      const userDetails = data.json(0);\n      await page.gotoRegistration();\n      await page.registerWith(userDetails);\n    }\n  );\n\n  Scenario("A User logs in with a bad password", () => {\n    Then(\n      "they are informed their password is incorrect",\n      async ({ world: { page } }: App) => {\n        await page.verifyBadPassword();\n      }\n    );\n  });\n}, "../features/my-feature.feature");\n\n// load multiple feature files\n\nFeature(\n  "../features/my-feature.feature",\n  "../features/my-other-feature.feature"\n);\n')))))}f.isMDXComponent=!0}}]);