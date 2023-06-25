"use strict";(self.webpackChunk_autometa_documentation=self.webpackChunk_autometa_documentation||[]).push([[3883],{7522:(e,t,r)=>{r.d(t,{Zo:()=>l,kt:()=>f});var n=r(9901);function o(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function a(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function i(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?a(Object(r),!0).forEach((function(t){o(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):a(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function s(e,t){if(null==e)return{};var r,n,o=function(e,t){if(null==e)return{};var r,n,o={},a=Object.keys(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||(o[r]=e[r]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}var u=n.createContext({}),c=function(e){var t=n.useContext(u),r=t;return e&&(r="function"==typeof e?e(t):i(i({},t),e)),r},l=function(e){var t=c(e.components);return n.createElement(u.Provider,{value:t},e.children)},p="mdxType",m={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},d=n.forwardRef((function(e,t){var r=e.components,o=e.mdxType,a=e.originalType,u=e.parentName,l=s(e,["components","mdxType","originalType","parentName"]),p=c(r),d=o,f=p["".concat(u,".").concat(d)]||p[d]||m[d]||a;return r?n.createElement(f,i(i({ref:t},l),{},{components:r})):n.createElement(f,i({ref:t},l))}));function f(e,t){var r=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=r.length,i=new Array(a);i[0]=d;var s={};for(var u in t)hasOwnProperty.call(t,u)&&(s[u]=t[u]);s.originalType=e,s[p]="string"==typeof e?e:o,i[1]=s;for(var c=2;c<a;c++)i[c]=r[c];return n.createElement.apply(null,i)}return n.createElement.apply(null,r)}d.displayName="MDXCreateElement"},404:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>u,contentTitle:()=>i,default:()=>m,frontMatter:()=>a,metadata:()=>s,toc:()=>c});var n=r(4321),o=(r(9901),r(7522));const a={sidebar_position:6},i="Test Scopes",s={unversionedId:"cucumber/test_runner/test-groups",id:"cucumber/test_runner/test-groups",title:"Test Scopes",description:"While Autometa can be run entirely with Global steps, it may be desireable",source:"@site/docs/cucumber/test_runner/test-groups.md",sourceDirName:"cucumber/test_runner",slug:"/cucumber/test_runner/test-groups",permalink:"/autometa/docs/cucumber/test_runner/test-groups",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/cucumber/test_runner/test-groups.md",tags:[],version:"current",sidebarPosition:6,frontMatter:{sidebar_position:6},sidebar:"cucumberRunnerBar",previous:{title:"Hooks",permalink:"/autometa/docs/cucumber/test_runner/hooks"},next:{title:"Tag Filtering",permalink:"/autometa/docs/cucumber/test_runner/tag-filtering"}},u={},c=[],l={toc:c},p="wrapper";function m(e){let{components:t,...r}=e;return(0,o.kt)(p,(0,n.Z)({},l,r,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"test-scopes"},"Test Scopes"),(0,o.kt)("p",null,"While Autometa can be run entirely with Global steps, it may be desireable\nto provide specific implementations for some scenarios. For example, step texts\nthat have high potential for conflict due to same text but different intended\nbehavior, or scenarios which have edge cases for the same text."),(0,o.kt)("p",null,"The available groups are ",(0,o.kt)("inlineCode",{parentName:"p"},"Feature"),", ",(0,o.kt)("inlineCode",{parentName:"p"},"Rule")," and ",(0,o.kt)("inlineCode",{parentName:"p"},"ScenarioOutline")," with the test type being ",(0,o.kt)("inlineCode",{parentName:"p"},"Scenario"),"."),(0,o.kt)("p",null,"By default, Autometa will assemble all rules, scenarios and outlines from\nglobal steps, but they can be explicitely overwritten. When overwritten, not\nevery step in that group needs to be defined. If there are 5 steps, and 4 are valid global steps, then only one step need be defined in the test group."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},'import {\n  Feature,\n  Rule,\n  ScenarioOutline,\n  Scenario,\n  Pass,\n} from "@autometa/cucumber-runner";\n\nFeature(() => {\n  Scenario("override this scenario", () => {\n    Given("override this specific step", Pass);\n  });\n  Rule("override this rule", () => {\n    ScenarioOutline("override this scenarioOutline", () => {\n      Given("a step unique to this outline", Pass);\n    });\n  });\n}, "./my-feature.ts");\n')))}m.isMDXComponent=!0}}]);