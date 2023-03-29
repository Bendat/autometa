"use strict";(self.webpackChunk_autometa_documentation=self.webpackChunk_autometa_documentation||[]).push([[6706],{7522:(e,t,n)=>{n.d(t,{Zo:()=>c,kt:()=>f});var r=n(9901);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function s(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function l(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?s(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):s(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function o(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},s=Object.keys(e);for(r=0;r<s.length;r++)n=s[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);for(r=0;r<s.length;r++)n=s[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var i=r.createContext({}),u=function(e){var t=r.useContext(i),n=t;return e&&(n="function"==typeof e?e(t):l(l({},t),e)),n},c=function(e){var t=u(e.components);return r.createElement(i.Provider,{value:t},e.children)},p="mdxType",m={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},d=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,s=e.originalType,i=e.parentName,c=o(e,["components","mdxType","originalType","parentName"]),p=u(n),d=a,f=p["".concat(i,".").concat(d)]||p[d]||m[d]||s;return n?r.createElement(f,l(l({ref:t},c),{},{components:n})):r.createElement(f,l({ref:t},c))}));function f(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var s=n.length,l=new Array(s);l[0]=d;var o={};for(var i in t)hasOwnProperty.call(t,i)&&(o[i]=t[i]);o.originalType=e,o[p]="string"==typeof e?e:a,l[1]=o;for(var u=2;u<s;u++)l[u]=n[u];return r.createElement.apply(null,l)}return r.createElement.apply(null,n)}d.displayName="MDXCreateElement"},9959:(e,t,n)=>{n.d(t,{Z:()=>l});var r=n(9901),a=n(4517);const s={tabItem:"tabItem_ojGo"};function l(e){let{children:t,hidden:n,className:l}=e;return r.createElement("div",{role:"tabpanel",className:(0,a.Z)(s.tabItem,l),hidden:n},t)}},7256:(e,t,n)=>{n.d(t,{Z:()=>w});var r=n(4321),a=n(9901),s=n(4517),l=n(3929),o=n(6172),i=n(7292),u=n(1397),c=n(1202);function p(e){return function(e){return a.Children.map(e,(e=>{if((0,a.isValidElement)(e)&&"value"in e.props)return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))}(e).map((e=>{let{props:{value:t,label:n,attributes:r,default:a}}=e;return{value:t,label:n,attributes:r,default:a}}))}function m(e){const{values:t,children:n}=e;return(0,a.useMemo)((()=>{const e=t??p(n);return function(e){const t=(0,u.l)(e,((e,t)=>e.value===t.value));if(t.length>0)throw new Error(`Docusaurus error: Duplicate values "${t.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[t,n])}function d(e){let{value:t,tabValues:n}=e;return n.some((e=>e.value===t))}function f(e){let{queryString:t=!1,groupId:n}=e;const r=(0,o.k6)(),s=function(e){let{queryString:t=!1,groupId:n}=e;if("string"==typeof t)return t;if(!1===t)return null;if(!0===t&&!n)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return n??null}({queryString:t,groupId:n});return[(0,i._X)(s),(0,a.useCallback)((e=>{if(!s)return;const t=new URLSearchParams(r.location.search);t.set(s,e),r.replace({...r.location,search:t.toString()})}),[s,r])]}function b(e){const{defaultValue:t,queryString:n=!1,groupId:r}=e,s=m(e),[l,o]=(0,a.useState)((()=>function(e){let{defaultValue:t,tabValues:n}=e;if(0===n.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(t){if(!d({value:t,tabValues:n}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${t}" but none of its children has the corresponding value. Available values are: ${n.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return t}const r=n.find((e=>e.default))??n[0];if(!r)throw new Error("Unexpected error: 0 tabValues");return r.value}({defaultValue:t,tabValues:s}))),[i,u]=f({queryString:n,groupId:r}),[p,b]=function(e){let{groupId:t}=e;const n=function(e){return e?`docusaurus.tab.${e}`:null}(t),[r,s]=(0,c.Nk)(n);return[r,(0,a.useCallback)((e=>{n&&s.set(e)}),[n,s])]}({groupId:r}),g=(()=>{const e=i??p;return d({value:e,tabValues:s})?e:null})();(0,a.useLayoutEffect)((()=>{g&&o(g)}),[g]);return{selectedValue:l,selectValue:(0,a.useCallback)((e=>{if(!d({value:e,tabValues:s}))throw new Error(`Can't select invalid tab value=${e}`);o(e),u(e),b(e)}),[u,b,s]),tabValues:s}}var g=n(8904);const h={tabList:"tabList_mjA9",tabItem:"tabItem_MCv3"};function v(e){let{className:t,block:n,selectedValue:o,selectValue:i,tabValues:u}=e;const c=[],{blockElementScrollPositionUntilNextRender:p}=(0,l.o5)(),m=e=>{const t=e.currentTarget,n=c.indexOf(t),r=u[n].value;r!==o&&(p(t),i(r))},d=e=>{let t=null;switch(e.key){case"Enter":m(e);break;case"ArrowRight":{const n=c.indexOf(e.currentTarget)+1;t=c[n]??c[0];break}case"ArrowLeft":{const n=c.indexOf(e.currentTarget)-1;t=c[n]??c[c.length-1];break}}t?.focus()};return a.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,s.Z)("tabs",{"tabs--block":n},t)},u.map((e=>{let{value:t,label:n,attributes:l}=e;return a.createElement("li",(0,r.Z)({role:"tab",tabIndex:o===t?0:-1,"aria-selected":o===t,key:t,ref:e=>c.push(e),onKeyDown:d,onClick:m},l,{className:(0,s.Z)("tabs__item",h.tabItem,l?.className,{"tabs__item--active":o===t})}),n??t)})))}function y(e){let{lazy:t,children:n,selectedValue:r}=e;if(n=Array.isArray(n)?n:[n],t){const e=n.find((e=>e.props.value===r));return e?(0,a.cloneElement)(e,{className:"margin-top--md"}):null}return a.createElement("div",{className:"margin-top--md"},n.map(((e,t)=>(0,a.cloneElement)(e,{key:t,hidden:e.props.value!==r}))))}function k(e){const t=b(e);return a.createElement("div",{className:(0,s.Z)("tabs-container",h.tabList)},a.createElement(v,(0,r.Z)({},e,t)),a.createElement(y,(0,r.Z)({},e,t)))}function w(e){const t=(0,g.Z)();return a.createElement(k,(0,r.Z)({key:String(t)},e))}},9366:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>i,default:()=>f,frontMatter:()=>o,metadata:()=>u,toc:()=>p});var r=n(4321),a=(n(9901),n(7522)),s=n(7256),l=n(9959);const o={sidebar_position:2},i="Steps",u={unversionedId:"cucumber/test_runner/steps",id:"cucumber/test_runner/steps",title:"Steps",description:"Local Steps",source:"@site/docs/cucumber/test_runner/steps.mdx",sourceDirName:"cucumber/test_runner",slug:"/cucumber/test_runner/steps",permalink:"/autometa/docs/cucumber/test_runner/steps",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/cucumber/test_runner/steps.mdx",tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2},sidebar:"cucumberRunnerBar",previous:{title:"Introduction",permalink:"/autometa/docs/cucumber/test_runner/intro"},next:{title:"Step Arguments",permalink:"/autometa/docs/cucumber/test_runner/step-arguments"}},c={},p=[{value:"Local Steps",id:"local-steps",level:2},{value:"Global Steps",id:"global-steps",level:2},{value:"Defining Global Steps",id:"defining-global-steps",level:2},{value:"Importing Global Steps manually",id:"importing-global-steps-manually",level:2}],m={toc:p},d="wrapper";function f(e){let{components:t,...n}=e;return(0,a.kt)(d,(0,r.Z)({},m,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"steps"},"Steps"),(0,a.kt)("h2",{id:"local-steps"},"Local Steps"),(0,a.kt)("p",null,"Steps definitions are created when one of the ",(0,a.kt)("inlineCode",{parentName:"p"},"Given")," ",(0,a.kt)("inlineCode",{parentName:"p"},"When")," or ",(0,a.kt)("inlineCode",{parentName:"p"},"Then")," functions\nare executed. They can be placed at the top level of a file, or nested inside either\n",(0,a.kt)("inlineCode",{parentName:"p"},"Feature"),", ",(0,a.kt)("inlineCode",{parentName:"p"},"Rule"),", ",(0,a.kt)("inlineCode",{parentName:"p"},"Scenario Outline")," ",(0,a.kt)("inlineCode",{parentName:"p"},"Scenario")," functions."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts",metastring:"title='Defining Steps'",title:"'Defining","Steps'":!0},"import { Given, When, Then, Feature, Scenario } = '@autometa/cucumber-runner';\n\n// Top Level Steps\nGiven('some given step text', ()=>{});\nWhen('some when step text', ()=>{});\nThen('some then step text', ()=>{});\n\n// Feature level steps\n// these will overrride top level steps is clashing\nFeature(() => {\n  // Override the top level step for\n  // all scenarios in this feature.\n  // Also overrides global steps.\n  Given(\"some given step text\", () => {})\n\n  Scenario('My Scenario', ()=>{\n    // Override the feature step of the same text\n    Given('some given step text', () => {})\n    // define a new step unique to this scenario\n    Given('a new step', ()=>{})\n\n  })\n}, './my-file.feature')\n")),(0,a.kt)("p",null,"If a step is defined at two or more levels of nesting (scope) and both\nmatch a ",(0,a.kt)("inlineCode",{parentName:"p"},".feature")," step, the innermost scope will be used and higher level\nmatches will be ignored."),(0,a.kt)("h2",{id:"global-steps"},"Global Steps"),(0,a.kt)("p",null,"The easiest way to create steps is to use global steps. Global Steps\nbehave like steps in official Cucumber, where they are registered and\nwill automatically be assembled into scenarios."),(0,a.kt)("p",null,"To use global steps, the ",(0,a.kt)("inlineCode",{parentName:"p"},"globalsRoot")," must be defined in ",(0,a.kt)("inlineCode",{parentName:"p"},"autometa.config.ts"),"."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'import "reflect-metadata";\nimport { defineConfig } from "@autometa/cucumber-runner";\n\ndefineConfig({\n  globals: "globals"\n});\n')),(0,a.kt)("p",null,"And ensure the config fill is executed by your test runner"),(0,a.kt)(s.Z,{mdxType:"Tabs"},(0,a.kt)(l.Z,{value:"vitest",label:"Vitest",mdxType:"TabItem"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-js",metastring:"title='vitest.config.js'",title:"'vitest.config.js'"},"import { defineConfig } from 'vitest/config'\n\ndefineConfig({\n  ...\n  setupFiles: ['autometa.config.ts']\n  include: ['**/*.{test,spec,feature}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']\n  ...\n})\n\n"))),(0,a.kt)(l.Z,{value:"jest",label:"Jest",mdxType:"TabItem"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-js",metastring:"title='jest.config.js'",title:"'jest.config.js'"},"export default {\n  ...\n  setupFilesAfterEnv: ['autometa.config.ts']\n  testMatch: ['**/?(*.)+(spec|test|feature).[jt]s?(x)']\n  ...\n}\n")))),(0,a.kt)("h2",{id:"defining-global-steps"},"Defining Global Steps"),(0,a.kt)("p",null,"Once a global step root has been configured, any steps within the ",(0,a.kt)("inlineCode",{parentName:"p"},"globalsRoot"),"\ndirectory will be registered in a global cache. Test files, which are files\nexecuting the ",(0,a.kt)("inlineCode",{parentName:"p"},"Feature")," function from ",(0,a.kt)("inlineCode",{parentName:"p"},"@autometa/cucumber-runner"),", will automatically\nassemble their scenarios, rules and scenario outlines using these steps"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts",metastring:"title='globals/user.steps'",title:"'globals/user.steps'"},'import { Given } from "@autometa/cucumber-runner";\n\nGiven("a user logs in", () => {});\n')),(0,a.kt)("p",null,"Then, assuming all relevant steps are defined globally, we can execute our\nfeature by simply referencing the file."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'import { Feature } from "@autometa/cucumber-runner";\n\nFeature("./my-feature.feature");\n')),(0,a.kt)("h2",{id:"importing-global-steps-manually"},"Importing Global Steps manually"),(0,a.kt)("p",null,"It may be desireable to declare global steps that\nare not automatically imported, for example they cover a seperate\nor integrating domain, and may clash with the standard step setup\ndefined."),(0,a.kt)("p",null,"To accomodate this, you can define global steps in a file not\ninside the ",(0,a.kt)("inlineCode",{parentName:"p"},"globalsRoot"),", and ",(0,a.kt)("inlineCode",{parentName:"p"},"import")," it. This will register\nthe defined steps for the file being executed."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts",metastring:"title='domain-b/user.steps'",title:"'domain-b/user.steps'"},'Given("a user performs obscure action", () => {});\n')),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts",metastring:"title='test/my-feature.test'",title:"'test/my-feature.test'"},'import "../domain-b/user.steps";\nimport {\n  Given,\n  When,\n  Then,\n  Feature,\n  Scenario\n} from "@autometa/cucumber-runner";\n\nFeature("./my-feature.feature");\n')))}f.isMDXComponent=!0}}]);