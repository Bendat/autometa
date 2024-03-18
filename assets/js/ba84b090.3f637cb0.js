"use strict";(self.webpackChunk_autometa_documentation=self.webpackChunk_autometa_documentation||[]).push([[8806],{4993:(e,t,n)=>{n.d(t,{Zo:()=>c,kt:()=>f});var a=n(2983);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function l(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function s(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?l(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):l(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function o(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},l=Object.keys(e);for(a=0;a<l.length;a++)n=l[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(a=0;a<l.length;a++)n=l[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var i=a.createContext({}),u=function(e){var t=a.useContext(i),n=t;return e&&(n="function"==typeof e?e(t):s(s({},t),e)),n},c=function(e){var t=u(e.components);return a.createElement(i.Provider,{value:t},e.children)},p="mdxType",m={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},d=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,l=e.originalType,i=e.parentName,c=o(e,["components","mdxType","originalType","parentName"]),p=u(n),d=r,f=p["".concat(i,".").concat(d)]||p[d]||m[d]||l;return n?a.createElement(f,s(s({ref:t},c),{},{components:n})):a.createElement(f,s({ref:t},c))}));function f(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var l=n.length,s=new Array(l);s[0]=d;var o={};for(var i in t)hasOwnProperty.call(t,i)&&(o[i]=t[i]);o.originalType=e,o[p]="string"==typeof e?e:r,s[1]=o;for(var u=2;u<l;u++)s[u]=n[u];return a.createElement.apply(null,s)}return a.createElement.apply(null,n)}d.displayName="MDXCreateElement"},6721:(e,t,n)=>{n.d(t,{Z:()=>s});var a=n(2983),r=n(4517);const l={tabItem:"tabItem_aDNL"};function s(e){let{children:t,hidden:n,className:s}=e;return a.createElement("div",{role:"tabpanel",className:(0,r.Z)(l.tabItem,s),hidden:n},t)}},9944:(e,t,n)=>{n.d(t,{Z:()=>w});var a=n(3050),r=n(2983),l=n(4517),s=n(2454),o=n(3729),i=n(4177),u=n(5932),c=n(9115);function p(e){return function(e){return r.Children.map(e,(e=>{if(!e||(0,r.isValidElement)(e)&&function(e){const{props:t}=e;return!!t&&"object"==typeof t&&"value"in t}(e))return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))?.filter(Boolean)??[]}(e).map((e=>{let{props:{value:t,label:n,attributes:a,default:r}}=e;return{value:t,label:n,attributes:a,default:r}}))}function m(e){const{values:t,children:n}=e;return(0,r.useMemo)((()=>{const e=t??p(n);return function(e){const t=(0,u.l)(e,((e,t)=>e.value===t.value));if(t.length>0)throw new Error(`Docusaurus error: Duplicate values "${t.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[t,n])}function d(e){let{value:t,tabValues:n}=e;return n.some((e=>e.value===t))}function f(e){let{queryString:t=!1,groupId:n}=e;const a=(0,o.k6)(),l=function(e){let{queryString:t=!1,groupId:n}=e;if("string"==typeof t)return t;if(!1===t)return null;if(!0===t&&!n)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return n??null}({queryString:t,groupId:n});return[(0,i._X)(l),(0,r.useCallback)((e=>{if(!l)return;const t=new URLSearchParams(a.location.search);t.set(l,e),a.replace({...a.location,search:t.toString()})}),[l,a])]}function b(e){const{defaultValue:t,queryString:n=!1,groupId:a}=e,l=m(e),[s,o]=(0,r.useState)((()=>function(e){let{defaultValue:t,tabValues:n}=e;if(0===n.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(t){if(!d({value:t,tabValues:n}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${t}" but none of its children has the corresponding value. Available values are: ${n.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return t}const a=n.find((e=>e.default))??n[0];if(!a)throw new Error("Unexpected error: 0 tabValues");return a.value}({defaultValue:t,tabValues:l}))),[i,u]=f({queryString:n,groupId:a}),[p,b]=function(e){let{groupId:t}=e;const n=function(e){return e?`docusaurus.tab.${e}`:null}(t),[a,l]=(0,c.Nk)(n);return[a,(0,r.useCallback)((e=>{n&&l.set(e)}),[n,l])]}({groupId:a}),g=(()=>{const e=i??p;return d({value:e,tabValues:l})?e:null})();(0,r.useLayoutEffect)((()=>{g&&o(g)}),[g]);return{selectedValue:s,selectValue:(0,r.useCallback)((e=>{if(!d({value:e,tabValues:l}))throw new Error(`Can't select invalid tab value=${e}`);o(e),u(e),b(e)}),[u,b,l]),tabValues:l}}var g=n(301);const h={tabList:"tabList_PMyH",tabItem:"tabItem_WJqR"};function v(e){let{className:t,block:n,selectedValue:o,selectValue:i,tabValues:u}=e;const c=[],{blockElementScrollPositionUntilNextRender:p}=(0,s.o5)(),m=e=>{const t=e.currentTarget,n=c.indexOf(t),a=u[n].value;a!==o&&(p(t),i(a))},d=e=>{let t=null;switch(e.key){case"Enter":m(e);break;case"ArrowRight":{const n=c.indexOf(e.currentTarget)+1;t=c[n]??c[0];break}case"ArrowLeft":{const n=c.indexOf(e.currentTarget)-1;t=c[n]??c[c.length-1];break}}t?.focus()};return r.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,l.Z)("tabs",{"tabs--block":n},t)},u.map((e=>{let{value:t,label:n,attributes:s}=e;return r.createElement("li",(0,a.Z)({role:"tab",tabIndex:o===t?0:-1,"aria-selected":o===t,key:t,ref:e=>c.push(e),onKeyDown:d,onClick:m},s,{className:(0,l.Z)("tabs__item",h.tabItem,s?.className,{"tabs__item--active":o===t})}),n??t)})))}function y(e){let{lazy:t,children:n,selectedValue:a}=e;const l=(Array.isArray(n)?n:[n]).filter(Boolean);if(t){const e=l.find((e=>e.props.value===a));return e?(0,r.cloneElement)(e,{className:"margin-top--md"}):null}return r.createElement("div",{className:"margin-top--md"},l.map(((e,t)=>(0,r.cloneElement)(e,{key:t,hidden:e.props.value!==a}))))}function k(e){const t=b(e);return r.createElement("div",{className:(0,l.Z)("tabs-container",h.tabList)},r.createElement(v,(0,a.Z)({},e,t)),r.createElement(y,(0,a.Z)({},e,t)))}function w(e){const t=(0,g.Z)();return r.createElement(k,(0,a.Z)({key:String(t)},e))}},4:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>i,default:()=>f,frontMatter:()=>o,metadata:()=>u,toc:()=>p});var a=n(3050),r=(n(2983),n(4993)),l=n(9944),s=n(6721);const o={sidebar_position:2},i="Steps",u={unversionedId:"cucumber/test_runner_legacy/steps",id:"cucumber/test_runner_legacy/steps",title:"Steps",description:"Local Steps",source:"@site/docs/cucumber/test_runner_legacy/steps.mdx",sourceDirName:"cucumber/test_runner_legacy",slug:"/cucumber/test_runner_legacy/steps",permalink:"/autometa/docs/cucumber/test_runner_legacy/steps",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/cucumber/test_runner_legacy/steps.mdx",tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2},sidebar:"cucumberRunnerBarLegacy",previous:{title:"Introduction",permalink:"/autometa/docs/cucumber/test_runner_legacy/intro"},next:{title:"Step Arguments",permalink:"/autometa/docs/cucumber/test_runner_legacy/step-arguments"}},c={},p=[{value:"Local Steps",id:"local-steps",level:2},{value:"Global Steps",id:"global-steps",level:2},{value:"Defining Global Steps",id:"defining-global-steps",level:2},{value:"Importing Global Steps manually",id:"importing-global-steps-manually",level:2}],m={toc:p},d="wrapper";function f(e){let{components:t,...n}=e;return(0,r.kt)(d,(0,a.Z)({},m,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"steps"},"Steps"),(0,r.kt)("h2",{id:"local-steps"},"Local Steps"),(0,r.kt)("p",null,"Steps definitions are created when one of the ",(0,r.kt)("inlineCode",{parentName:"p"},"Given")," ",(0,r.kt)("inlineCode",{parentName:"p"},"When")," or ",(0,r.kt)("inlineCode",{parentName:"p"},"Then")," functions\nare executed. They can be placed at the top level of a file, or nested inside either\n",(0,r.kt)("inlineCode",{parentName:"p"},"Feature"),", ",(0,r.kt)("inlineCode",{parentName:"p"},"Rule"),", ",(0,r.kt)("inlineCode",{parentName:"p"},"Scenario Outline")," ",(0,r.kt)("inlineCode",{parentName:"p"},"Scenario")," functions."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts",metastring:"title='Defining Steps'",title:"'Defining","Steps'":!0},"import { Given, When, Then, Feature, Scenario } = '@autometa/cucumber-runner';\n\n// Top Level Steps\nGiven('some given step text', ()=>{});\nWhen('some when step text', ()=>{});\nThen('some then step text', ()=>{});\n\n// Feature level steps\n// these will overrride top level steps is clashing\nFeature(() => {\n  // Override the top level step for\n  // all scenarios in this feature.\n  // Also overrides global steps.\n  Given(\"some given step text\", () => {})\n\n  Scenario('My Scenario', ()=>{\n    // Override the feature step of the same text\n    Given('some given step text', () => {})\n    // define a new step unique to this scenario\n    Given('a new step', ()=>{})\n\n  })\n}, './my-file.feature')\n")),(0,r.kt)("p",null,"If a step is defined at two or more levels of nesting (scope) and both\nmatch a ",(0,r.kt)("inlineCode",{parentName:"p"},".feature")," step, the innermost scope will be used and higher level\nmatches will be ignored."),(0,r.kt)("h2",{id:"global-steps"},"Global Steps"),(0,r.kt)("p",null,"The easiest way to create steps is to use global steps. Global Steps\nbehave like steps in official Cucumber, where they are registered and\nwill automatically be assembled into scenarios."),(0,r.kt)("p",null,"To use global steps, the ",(0,r.kt)("inlineCode",{parentName:"p"},"globalsRoot")," must be defined in ",(0,r.kt)("inlineCode",{parentName:"p"},"autometa.config.ts"),"."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},'import "reflect-metadata";\nimport { defineConfig } from "@autometa/cucumber-runner";\n\ndefineConfig({\n  globals: "globals"\n});\n')),(0,r.kt)("p",null,"And ensure the config fill is executed by your test runner"),(0,r.kt)(l.Z,{mdxType:"Tabs"},(0,r.kt)(s.Z,{value:"vitest",label:"Vitest",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-js",metastring:"title='vitest.config.js'",title:"'vitest.config.js'"},"import { defineConfig } from 'vitest/config'\n\ndefineConfig({\n  ...\n  setupFiles: ['autometa.config.ts']\n  include: ['**/*.{test,spec,feature}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']\n  ...\n})\n\n"))),(0,r.kt)(s.Z,{value:"jest",label:"Jest",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-js",metastring:"title='jest.config.js'",title:"'jest.config.js'"},"export default {\n  ...\n  setupFilesAfterEnv: ['autometa.config.ts']\n  testMatch: ['**/?(*.)+(spec|test|feature).[jt]s?(x)']\n  ...\n}\n")))),(0,r.kt)("h2",{id:"defining-global-steps"},"Defining Global Steps"),(0,r.kt)("p",null,"Once a global step root has been configured, any steps within the ",(0,r.kt)("inlineCode",{parentName:"p"},"globalsRoot"),"\ndirectory will be registered in a global cache. Test files, which are files\nexecuting the ",(0,r.kt)("inlineCode",{parentName:"p"},"Feature")," function from ",(0,r.kt)("inlineCode",{parentName:"p"},"@autometa/cucumber-runner"),", will automatically\nassemble their scenarios, rules and scenario outlines using these steps"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts",metastring:"title='globals/user.steps'",title:"'globals/user.steps'"},'import { Given } from "@autometa/cucumber-runner";\n\nGiven("a user logs in", () => {});\n')),(0,r.kt)("p",null,"Then, assuming all relevant steps are defined globally, we can execute our\nfeature by simply referencing the file."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},'import { Feature } from "@autometa/cucumber-runner";\n\nFeature("./my-feature.feature");\n')),(0,r.kt)("h2",{id:"importing-global-steps-manually"},"Importing Global Steps manually"),(0,r.kt)("p",null,"It may be desireable to declare global steps that\nare not automatically imported, for example they cover a seperate\nor integrating domain, and may clash with the standard step setup\ndefined."),(0,r.kt)("p",null,"To accomodate this, you can define global steps in a file not\ninside the ",(0,r.kt)("inlineCode",{parentName:"p"},"globalsRoot"),", and ",(0,r.kt)("inlineCode",{parentName:"p"},"import")," it. This will register\nthe defined steps for the file being executed."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts",metastring:"title='domain-b/user.steps'",title:"'domain-b/user.steps'"},'Given("a user performs obscure action", () => {});\n')),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts",metastring:"title='test/my-feature.test'",title:"'test/my-feature.test'"},'import "../domain-b/user.steps";\nimport {\n  Given,\n  When,\n  Then,\n  Feature,\n  Scenario\n} from "@autometa/cucumber-runner";\n\nFeature("./my-feature.feature");\n')))}f.isMDXComponent=!0}}]);