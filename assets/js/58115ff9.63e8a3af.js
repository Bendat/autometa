"use strict";(self.webpackChunk_autometa_documentation=self.webpackChunk_autometa_documentation||[]).push([[3589],{7522:(e,t,r)=>{r.d(t,{Zo:()=>p,kt:()=>g});var n=r(9901);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function o(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function i(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?o(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function u(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},o=Object.keys(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var c=n.createContext({}),s=function(e){var t=n.useContext(c),r=t;return e&&(r="function"==typeof e?e(t):i(i({},t),e)),r},p=function(e){var t=s(e.components);return n.createElement(c.Provider,{value:t},e.children)},l="mdxType",m={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},f=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,o=e.originalType,c=e.parentName,p=u(e,["components","mdxType","originalType","parentName"]),l=s(r),f=a,g=l["".concat(c,".").concat(f)]||l[f]||m[f]||o;return r?n.createElement(g,i(i({ref:t},p),{},{components:r})):n.createElement(g,i({ref:t},p))}));function g(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=r.length,i=new Array(o);i[0]=f;var u={};for(var c in t)hasOwnProperty.call(t,c)&&(u[c]=t[c]);u.originalType=e,u[l]="string"==typeof e?e:a,i[1]=u;for(var s=2;s<o;s++)i[s]=r[s];return n.createElement.apply(null,i)}return n.createElement.apply(null,r)}f.displayName="MDXCreateElement"},499:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>c,contentTitle:()=>i,default:()=>m,frontMatter:()=>o,metadata:()=>u,toc:()=>s});var n=r(4321),a=(r(9901),r(7522));const o={sidebar_position:7},i="Tag Filtering",u={unversionedId:"cucumber/test_runner/tag-filtering",id:"cucumber/test_runner/tag-filtering",title:"Tag Filtering",description:"Autometa supports Tag Expressions.",source:"@site/docs/cucumber/test_runner/tag-filtering.md",sourceDirName:"cucumber/test_runner",slug:"/cucumber/test_runner/tag-filtering",permalink:"/autometa/docs/cucumber/test_runner/tag-filtering",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/cucumber/test_runner/tag-filtering.md",tags:[],version:"current",sidebarPosition:7,frontMatter:{sidebar_position:7},sidebar:"cucumberRunnerBar",previous:{title:"Test Groups",permalink:"/autometa/docs/cucumber/test_runner/test-groups"}},c={},s=[],p={toc:s},l="wrapper";function m(e){let{components:t,...r}=e;return(0,a.kt)(l,(0,n.Z)({},p,r,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"tag-filtering"},"Tag Filtering"),(0,a.kt)("p",null,"Autometa supports ",(0,a.kt)("a",{parentName:"p",href:"https://cucumber.io/docs/cucumber/api/?lang=kotlin#tag-expressions"},"Tag Expressions"),"."),(0,a.kt)("p",null,"To filter tests by tag, either define an environment variable ",(0,a.kt)("inlineCode",{parentName:"p"},"CUCUMBER_FILTER_TAGS")," with a tag expression, or pass a tag expression string\nto ",(0,a.kt)("inlineCode",{parentName:"p"},"tagFilter")," in ",(0,a.kt)("inlineCode",{parentName:"p"},"defineConfig")),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'import { defineConfig } from "@autometa/cucumber-runner";\n\ndefineConfig({\n  tagFilter: "@a and not @b",\n  // ...\n});\n')))}m.isMDXComponent=!0}}]);