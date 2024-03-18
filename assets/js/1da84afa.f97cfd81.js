"use strict";(self.webpackChunk_autometa_documentation=self.webpackChunk_autometa_documentation||[]).push([[4226],{4993:(e,t,r)=>{r.d(t,{Zo:()=>c,kt:()=>f});var n=r(2983);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function s(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function u(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?s(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):s(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function i(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},s=Object.keys(e);for(n=0;n<s.length;n++)r=s[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);for(n=0;n<s.length;n++)r=s[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var o=n.createContext({}),l=function(e){var t=n.useContext(o),r=t;return e&&(r="function"==typeof e?e(t):u(u({},t),e)),r},c=function(e){var t=l(e.components);return n.createElement(o.Provider,{value:t},e.children)},p="mdxType",m={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},d=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,s=e.originalType,o=e.parentName,c=i(e,["components","mdxType","originalType","parentName"]),p=l(r),d=a,f=p["".concat(o,".").concat(d)]||p[d]||m[d]||s;return r?n.createElement(f,u(u({ref:t},c),{},{components:r})):n.createElement(f,u({ref:t},c))}));function f(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var s=r.length,u=new Array(s);u[0]=d;var i={};for(var o in t)hasOwnProperty.call(t,o)&&(i[o]=t[o]);i.originalType=e,i[p]="string"==typeof e?e:a,u[1]=i;for(var l=2;l<s;l++)u[l]=r[l];return n.createElement.apply(null,u)}return n.createElement.apply(null,r)}d.displayName="MDXCreateElement"},6721:(e,t,r)=>{r.d(t,{Z:()=>u});var n=r(2983),a=r(4517);const s={tabItem:"tabItem_aDNL"};function u(e){let{children:t,hidden:r,className:u}=e;return n.createElement("div",{role:"tabpanel",className:(0,a.Z)(s.tabItem,u),hidden:r},t)}},9944:(e,t,r)=>{r.d(t,{Z:()=>w});var n=r(3050),a=r(2983),s=r(4517),u=r(2454),i=r(3729),o=r(4177),l=r(5932),c=r(9115);function p(e){return function(e){return a.Children.map(e,(e=>{if(!e||(0,a.isValidElement)(e)&&function(e){const{props:t}=e;return!!t&&"object"==typeof t&&"value"in t}(e))return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))?.filter(Boolean)??[]}(e).map((e=>{let{props:{value:t,label:r,attributes:n,default:a}}=e;return{value:t,label:r,attributes:n,default:a}}))}function m(e){const{values:t,children:r}=e;return(0,a.useMemo)((()=>{const e=t??p(r);return function(e){const t=(0,l.l)(e,((e,t)=>e.value===t.value));if(t.length>0)throw new Error(`Docusaurus error: Duplicate values "${t.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[t,r])}function d(e){let{value:t,tabValues:r}=e;return r.some((e=>e.value===t))}function f(e){let{queryString:t=!1,groupId:r}=e;const n=(0,i.k6)(),s=function(e){let{queryString:t=!1,groupId:r}=e;if("string"==typeof t)return t;if(!1===t)return null;if(!0===t&&!r)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return r??null}({queryString:t,groupId:r});return[(0,o._X)(s),(0,a.useCallback)((e=>{if(!s)return;const t=new URLSearchParams(n.location.search);t.set(s,e),n.replace({...n.location,search:t.toString()})}),[s,n])]}function b(e){const{defaultValue:t,queryString:r=!1,groupId:n}=e,s=m(e),[u,i]=(0,a.useState)((()=>function(e){let{defaultValue:t,tabValues:r}=e;if(0===r.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(t){if(!d({value:t,tabValues:r}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${t}" but none of its children has the corresponding value. Available values are: ${r.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return t}const n=r.find((e=>e.default))??r[0];if(!n)throw new Error("Unexpected error: 0 tabValues");return n.value}({defaultValue:t,tabValues:s}))),[o,l]=f({queryString:r,groupId:n}),[p,b]=function(e){let{groupId:t}=e;const r=function(e){return e?`docusaurus.tab.${e}`:null}(t),[n,s]=(0,c.Nk)(r);return[n,(0,a.useCallback)((e=>{r&&s.set(e)}),[r,s])]}({groupId:n}),h=(()=>{const e=o??p;return d({value:e,tabValues:s})?e:null})();(0,a.useLayoutEffect)((()=>{h&&i(h)}),[h]);return{selectedValue:u,selectValue:(0,a.useCallback)((e=>{if(!d({value:e,tabValues:s}))throw new Error(`Can't select invalid tab value=${e}`);i(e),l(e),b(e)}),[l,b,s]),tabValues:s}}var h=r(301);const g={tabList:"tabList_PMyH",tabItem:"tabItem_WJqR"};function y(e){let{className:t,block:r,selectedValue:i,selectValue:o,tabValues:l}=e;const c=[],{blockElementScrollPositionUntilNextRender:p}=(0,u.o5)(),m=e=>{const t=e.currentTarget,r=c.indexOf(t),n=l[r].value;n!==i&&(p(t),o(n))},d=e=>{let t=null;switch(e.key){case"Enter":m(e);break;case"ArrowRight":{const r=c.indexOf(e.currentTarget)+1;t=c[r]??c[0];break}case"ArrowLeft":{const r=c.indexOf(e.currentTarget)-1;t=c[r]??c[c.length-1];break}}t?.focus()};return a.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,s.Z)("tabs",{"tabs--block":r},t)},l.map((e=>{let{value:t,label:r,attributes:u}=e;return a.createElement("li",(0,n.Z)({role:"tab",tabIndex:i===t?0:-1,"aria-selected":i===t,key:t,ref:e=>c.push(e),onKeyDown:d,onClick:m},u,{className:(0,s.Z)("tabs__item",g.tabItem,u?.className,{"tabs__item--active":i===t})}),r??t)})))}function v(e){let{lazy:t,children:r,selectedValue:n}=e;const s=(Array.isArray(r)?r:[r]).filter(Boolean);if(t){const e=s.find((e=>e.props.value===n));return e?(0,a.cloneElement)(e,{className:"margin-top--md"}):null}return a.createElement("div",{className:"margin-top--md"},s.map(((e,t)=>(0,a.cloneElement)(e,{key:t,hidden:e.props.value!==n}))))}function k(e){const t=b(e);return a.createElement("div",{className:(0,s.Z)("tabs-container",g.tabList)},a.createElement(y,(0,n.Z)({},e,t)),a.createElement(v,(0,n.Z)({},e,t)))}function w(e){const t=(0,h.Z)();return a.createElement(k,(0,n.Z)({key:String(t)},e))}},3624:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>c,contentTitle:()=>o,default:()=>f,frontMatter:()=>i,metadata:()=>l,toc:()=>p});var n=r(3050),a=(r(2983),r(4993)),s=r(9944),u=r(6721);const i={sidebar_position:0},o="Autometa",l={unversionedId:"cucumber/test_runner/intro",id:"cucumber/test_runner/intro",title:"Autometa",description:"Autometa is a toolkit of libraries to supercharge automation testing",source:"@site/docs/cucumber/test_runner/intro.mdx",sourceDirName:"cucumber/test_runner",slug:"/cucumber/test_runner/intro",permalink:"/autometa/docs/cucumber/test_runner/intro",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/cucumber/test_runner/intro.mdx",tags:[],version:"current",sidebarPosition:0,frontMatter:{sidebar_position:0},sidebar:"cucumberRunnerBar",next:{title:"Getting started",permalink:"/autometa/docs/cucumber/test_runner/getting_started"}},c={},p=[{value:"Cucumber Runner",id:"cucumber-runner",level:2},{value:"Features",id:"features",level:3},{value:"Automatic inference for Step Definition arguments",id:"automatic-inference-for-step-definition-arguments",level:4},{value:"Dependency Injection",id:"dependency-injection",level:4},{value:"Custom Cucumber Expressions",id:"custom-cucumber-expressions",level:4},{value:"Fuzzy Search for Missing Step Definitions",id:"fuzzy-search-for-missing-step-definitions",level:4},{value:"Flexible",id:"flexible",level:4}],m={toc:p},d="wrapper";function f(e){let{components:t,...r}=e;return(0,a.kt)(d,(0,n.Z)({},m,r,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"autometa"},"Autometa"),(0,a.kt)("p",null,"Autometa is a toolkit of libraries to supercharge automation testing\nin ",(0,a.kt)("a",{parentName:"p",href:"https://cucumber.io/docs/installation/javascript/"},"Cucumber"),", built\nto work with ",(0,a.kt)("a",{parentName:"p",href:"https://jestjs.io/"},"Jest")," and in future ",(0,a.kt)("a",{parentName:"p",href:"https://vitest.dev/"},"Vitest"),"."),(0,a.kt)("p",null,"Primarily Autometa is centered around it's cucumber runner, however it also maintains\na number of standalone libraries that might be useful in various projects:"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("a",{parentName:"li",href:"https://www.npmjs.com/package/@autometa/dto-builder"},(0,a.kt)("strong",{parentName:"a"},"Builder Pattern"))," - Automatically\ngenerate Builder pattern classes from a DTO class using decorators"),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("a",{parentName:"li",href:"https://www.npmjs.com/package/@autometa/status-codes"},(0,a.kt)("strong",{parentName:"a"},"Status Codes"))," - Object containing\nHTTP status codes and standard text"),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("a",{parentName:"li",href:"https://www.npmjs.com/package/@autometa/overloaded"},(0,a.kt)("strong",{parentName:"a"},"Overloaded"))," - Easily handle variadic arguments\nin overloaded or pattern based functions and methods")),(0,a.kt)("h2",{id:"cucumber-runner"},"Cucumber Runner"),(0,a.kt)("p",null,"Autometa's Cucumber Runner brings gherkin to Jest. Inspired by ",(0,a.kt)("a",{parentName:"p",href:"https://www.npmjs.com/package/jest-cucumber"},"Jest Cucumber")," Autometa supports 3 styles of writing tests, which can be mix and match"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},"Nested function callbacks",(0,a.kt)("ul",{parentName:"li"},(0,a.kt)("li",{parentName:"ul"},"This option strongly resembles both Jests ",(0,a.kt)("inlineCode",{parentName:"li"},"describe -> it")," pattern and jest-cucumbers nested\nstructure"))),(0,a.kt)("li",{parentName:"ul"},"Global steps",(0,a.kt)("ul",{parentName:"li"},(0,a.kt)("li",{parentName:"ul"},"This option more closely resembles ",(0,a.kt)("inlineCode",{parentName:"li"},"cucumberjs"),", using globally defined steps that\nare assembled into scenarios at runtime"),(0,a.kt)("li",{parentName:"ul"},"Global steps can be used as shared steps when using nested callbacks, so common steps\nare defined globally while test specific steps are defined only where they're needed"))),(0,a.kt)("li",{parentName:"ul"},"Gherkin Only",(0,a.kt)("ul",{parentName:"li"},(0,a.kt)("li",{parentName:"ul"},"Very similar to cucumberjs, executing ",(0,a.kt)("inlineCode",{parentName:"li"},".feature")," files with globally defined steps,\nbypassing the need to create intermediary testfiles.")))),(0,a.kt)("h3",{id:"features"},"Features"),(0,a.kt)("h4",{id:"automatic-inference-for-step-definition-arguments"},"Automatic inference for Step Definition arguments"),(0,a.kt)("p",null,"Leverages Typescripts type system to automatically infer Cucumber Expression arguments\nfrom its string literal"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},"// Given I have 5 cats\nGiven(\"I have {int} {word}\", (count, animal) => {\n  // -- inferred as 'number' ---^     |\n  // ----- inferred as 'string' ------\u2518\n});\n")),(0,a.kt)("h4",{id:"dependency-injection"},"Dependency Injection"),(0,a.kt)("p",null,"Dependency Injection wires together your complex behaviors simply."),(0,a.kt)(s.Z,{mdxType:"Tabs"},(0,a.kt)(u.Z,{value:"fixture",label:"Fixture",mdxType:"TabItem"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="src/http/client.ts"',title:'"src/http/client.ts"'},'import { Fixture } from "@autometa/runner";\n\n@Fixture\nexport class HttpClient {\n  async get(...args) {}\n  async post(...args) {}\n  async put(...args) {}\n  async delete(...args) {}\n}\n'))),(0,a.kt)(u.Z,{value:"app",label:"App",mdxType:"TabItem"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="src/app/app.ts"',title:'"src/app/app.ts"'},'import { AppType } from "@autometa/runner";\nimport { HttpClient } from "../http/client";\nimport { World } from "../world/world";\n\n@AppType(World)\nexport class App {\n  // http is automatically injected\n  constructor(readonly http: HttpClient) {}\n}\n'))),(0,a.kt)(u.Z,{value:"step",label:"Step Definition",mdxType:"TabItem"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="src/steps/given.ts"',title:'"src/steps/given.ts"'},'import { Given } from "@autometa/runner";\n\nGiven("I have a {user}", async (user, { world, http }) => {\n  world.getUserResponse = await http.get(`/users/${user}`);\n});\n')))),(0,a.kt)("h4",{id:"custom-cucumber-expressions"},"Custom Cucumber Expressions"),(0,a.kt)("p",null,"Improved support for custom Cucumber Expressions."),(0,a.kt)("p",null,"See ",(0,a.kt)("a",{parentName:"p",href:"./cucumber_expressions"},"Cucumber Expressions")," section."),(0,a.kt)("h4",{id:"fuzzy-search-for-missing-step-definitions"},"Fuzzy Search for Missing Step Definitions"),(0,a.kt)("p",null,"Easily identify typos in step definitions using fuzzy search error reporting."),(0,a.kt)("h4",{id:"flexible"},"Flexible"),(0,a.kt)("p",null,"Write your tests like jest-cucumber, or by executing gherkin ",(0,a.kt)("inlineCode",{parentName:"p"},".feature")," files using\nJest transformations."))}f.isMDXComponent=!0}}]);