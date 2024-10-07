"use strict";(self.webpackChunk_autometa_documentation=self.webpackChunk_autometa_documentation||[]).push([[6099],{4993:(e,t,a)=>{a.d(t,{Zo:()=>c,kt:()=>b});var n=a(2983);function r(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function l(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,n)}return a}function u(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?l(Object(a),!0).forEach((function(t){r(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):l(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function s(e,t){if(null==e)return{};var a,n,r=function(e,t){if(null==e)return{};var a,n,r={},l=Object.keys(e);for(n=0;n<l.length;n++)a=l[n],t.indexOf(a)>=0||(r[a]=e[a]);return r}(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(n=0;n<l.length;n++)a=l[n],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(r[a]=e[a])}return r}var o=n.createContext({}),i=function(e){var t=n.useContext(o),a=t;return e&&(a="function"==typeof e?e(t):u(u({},t),e)),a},c=function(e){var t=i(e.components);return n.createElement(o.Provider,{value:t},e.children)},p="mdxType",m={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},d=n.forwardRef((function(e,t){var a=e.components,r=e.mdxType,l=e.originalType,o=e.parentName,c=s(e,["components","mdxType","originalType","parentName"]),p=i(a),d=r,b=p["".concat(o,".").concat(d)]||p[d]||m[d]||l;return a?n.createElement(b,u(u({ref:t},c),{},{components:a})):n.createElement(b,u({ref:t},c))}));function b(e,t){var a=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var l=a.length,u=new Array(l);u[0]=d;var s={};for(var o in t)hasOwnProperty.call(t,o)&&(s[o]=t[o]);s.originalType=e,s[p]="string"==typeof e?e:r,u[1]=s;for(var i=2;i<l;i++)u[i]=a[i];return n.createElement.apply(null,u)}return n.createElement.apply(null,a)}d.displayName="MDXCreateElement"},8140:(e,t,a)=>{a.d(t,{Z:()=>u});var n=a(2983),r=a(4517);const l={tabItem:"tabItem_jUsi"};function u(e){let{children:t,hidden:a,className:u}=e;return n.createElement("div",{role:"tabpanel",className:(0,r.Z)(l.tabItem,u),hidden:a},t)}},6895:(e,t,a)=>{a.d(t,{Z:()=>w});var n=a(3050),r=a(2983),l=a(4517),u=a(4760),s=a(3729),o=a(4255),i=a(291),c=a(9032);function p(e){return function(e){return r.Children.map(e,(e=>{if(!e||(0,r.isValidElement)(e)&&function(e){const{props:t}=e;return!!t&&"object"==typeof t&&"value"in t}(e))return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))?.filter(Boolean)??[]}(e).map((e=>{let{props:{value:t,label:a,attributes:n,default:r}}=e;return{value:t,label:a,attributes:n,default:r}}))}function m(e){const{values:t,children:a}=e;return(0,r.useMemo)((()=>{const e=t??p(a);return function(e){const t=(0,i.l)(e,((e,t)=>e.value===t.value));if(t.length>0)throw new Error(`Docusaurus error: Duplicate values "${t.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[t,a])}function d(e){let{value:t,tabValues:a}=e;return a.some((e=>e.value===t))}function b(e){let{queryString:t=!1,groupId:a}=e;const n=(0,s.k6)(),l=function(e){let{queryString:t=!1,groupId:a}=e;if("string"==typeof t)return t;if(!1===t)return null;if(!0===t&&!a)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return a??null}({queryString:t,groupId:a});return[(0,o._X)(l),(0,r.useCallback)((e=>{if(!l)return;const t=new URLSearchParams(n.location.search);t.set(l,e),n.replace({...n.location,search:t.toString()})}),[l,n])]}function f(e){const{defaultValue:t,queryString:a=!1,groupId:n}=e,l=m(e),[u,s]=(0,r.useState)((()=>function(e){let{defaultValue:t,tabValues:a}=e;if(0===a.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(t){if(!d({value:t,tabValues:a}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${t}" but none of its children has the corresponding value. Available values are: ${a.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return t}const n=a.find((e=>e.default))??a[0];if(!n)throw new Error("Unexpected error: 0 tabValues");return n.value}({defaultValue:t,tabValues:l}))),[o,i]=b({queryString:a,groupId:n}),[p,f]=function(e){let{groupId:t}=e;const a=function(e){return e?`docusaurus.tab.${e}`:null}(t),[n,l]=(0,c.Nk)(a);return[n,(0,r.useCallback)((e=>{a&&l.set(e)}),[a,l])]}({groupId:n}),g=(()=>{const e=o??p;return d({value:e,tabValues:l})?e:null})();(0,r.useLayoutEffect)((()=>{g&&s(g)}),[g]);return{selectedValue:u,selectValue:(0,r.useCallback)((e=>{if(!d({value:e,tabValues:l}))throw new Error(`Can't select invalid tab value=${e}`);s(e),i(e),f(e)}),[i,f,l]),tabValues:l}}var g=a(8448);const h={tabList:"tabList_knRu",tabItem:"tabItem_nppw"};function v(e){let{className:t,block:a,selectedValue:s,selectValue:o,tabValues:i}=e;const c=[],{blockElementScrollPositionUntilNextRender:p}=(0,u.o5)(),m=e=>{const t=e.currentTarget,a=c.indexOf(t),n=i[a].value;n!==s&&(p(t),o(n))},d=e=>{let t=null;switch(e.key){case"Enter":m(e);break;case"ArrowRight":{const a=c.indexOf(e.currentTarget)+1;t=c[a]??c[0];break}case"ArrowLeft":{const a=c.indexOf(e.currentTarget)-1;t=c[a]??c[c.length-1];break}}t?.focus()};return r.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,l.Z)("tabs",{"tabs--block":a},t)},i.map((e=>{let{value:t,label:a,attributes:u}=e;return r.createElement("li",(0,n.Z)({role:"tab",tabIndex:s===t?0:-1,"aria-selected":s===t,key:t,ref:e=>c.push(e),onKeyDown:d,onClick:m},u,{className:(0,l.Z)("tabs__item",h.tabItem,u?.className,{"tabs__item--active":s===t})}),a??t)})))}function k(e){let{lazy:t,children:a,selectedValue:n}=e;const l=(Array.isArray(a)?a:[a]).filter(Boolean);if(t){const e=l.find((e=>e.props.value===n));return e?(0,r.cloneElement)(e,{className:"margin-top--md"}):null}return r.createElement("div",{className:"margin-top--md"},l.map(((e,t)=>(0,r.cloneElement)(e,{key:t,hidden:e.props.value!==n}))))}function y(e){const t=f(e);return r.createElement("div",{className:(0,l.Z)("tabs-container",h.tabList)},r.createElement(v,(0,n.Z)({},e,t)),r.createElement(k,(0,n.Z)({},e,t)))}function w(e){const t=(0,g.Z)();return r.createElement(y,(0,n.Z)({key:String(t)},e))}},4362:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>c,contentTitle:()=>o,default:()=>b,frontMatter:()=>s,metadata:()=>i,toc:()=>p});var n=a(3050),r=(a(2983),a(4993)),l=a(6895),u=a(8140);const s={sidebar_position:3},o="Step Arguments",i={unversionedId:"cucumber/test_runner_legacy/step-arguments",id:"cucumber/test_runner_legacy/step-arguments",title:"Step Arguments",description:"There are a number of situations where data will be",source:"@site/docs/cucumber/test_runner_legacy/step-arguments.mdx",sourceDirName:"cucumber/test_runner_legacy",slug:"/cucumber/test_runner_legacy/step-arguments",permalink:"/autometa/docs/cucumber/test_runner_legacy/step-arguments",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/cucumber/test_runner_legacy/step-arguments.mdx",tags:[],version:"current",sidebarPosition:3,frontMatter:{sidebar_position:3},sidebar:"cucumberRunnerBarLegacy",previous:{title:"Steps",permalink:"/autometa/docs/cucumber/test_runner_legacy/steps"},next:{title:"Data Tables",permalink:"/autometa/docs/cucumber/test_runner_legacy/datatables"}},c={},p=[{value:"Cucumber Expressions",id:"cucumber-expressions",level:2},{value:"Custom Parameter Types",id:"custom-parameter-types",level:3},{value:"Defining Custom Paramters",id:"defining-custom-paramters",level:3},{value:"Regular Expressions",id:"regular-expressions",level:2},{value:"Examples Table",id:"examples-table",level:2},{value:"Datatables",id:"datatables",level:2},{value:"Docstring",id:"docstring",level:2}],m={toc:p},d="wrapper";function b(e){let{components:t,...a}=e;return(0,r.kt)(d,(0,n.Z)({},m,a,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"step-arguments"},"Step Arguments"),(0,r.kt)("p",null,"There are a number of situations where data will be\nextracted from a feature file and passed to a step as\nan argument, typically as either ",(0,r.kt)("inlineCode",{parentName:"p"},"Examples")," table data,\ndocstrings or a datatable."),(0,r.kt)("p",null,"These arguments wil be passed to step the step function\ncallback parameter."),(0,r.kt)("h2",{id:"cucumber-expressions"},"Cucumber Expressions"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/cucumber/cucumber-expressions"},"Cucumber Expressions")," are\na novel way of matching string, substrings or custom types with identifiers."),(0,r.kt)("p",null,"For example taking the following Gherkin steps:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-gherkin"},"Given a user Johnny\nGiven a user Paul\nGiven an age 24\nGiven an age 32\n")),(0,r.kt)("p",null,"We can match these with"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},'Given("a user {word}", (name: string) => {});\nGiven("an age {int}", (age: number) => {});\n')),(0,r.kt)("p",null,"Notice the argument types: cucumber expressions automatically cast their\nmatch to an appropriate type. A word remains a string, while an int\nis converted to a number."),(0,r.kt)("h3",{id:"custom-parameter-types"},"Custom Parameter Types"),(0,r.kt)("p",null,"On top of the parameter types provided by Cucumber, a number\nof custom types are defined and available for use:"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"boolean",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"Matches a boolean value"),(0,r.kt)("li",{parentName:"ul"},"values: true | false"),(0,r.kt)("li",{parentName:"ul"},"example: `Given('a {boolean} value', (bool: boolean)=>console.log(bool));"))),(0,r.kt)("li",{parentName:"ul"},"bool",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"alias of ",(0,r.kt)("inlineCode",{parentName:"li"},"boolean")))),(0,r.kt)("li",{parentName:"ul"},"number",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"Matches an integer or float value"),(0,r.kt)("li",{parentName:"ul"},"values: any numeric value"),(0,r.kt)("li",{parentName:"ul"},"example: `Given('a {number} value', (num: number)=>console.log(num));"))),(0,r.kt)("li",{parentName:"ul"},"words",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"Matches multiple alphabetic words with spaces between them"),(0,r.kt)("li",{parentName:"ul"},"values: any numeric value"),(0,r.kt)("li",{parentName:"ul"},"example: `Given('a {number} value', (bool: number)=>console.log(bool));"),(0,r.kt)("li",{parentName:"ul"},"warning: this is a very broad matcher. Use with caution.")))),(0,r.kt)("h3",{id:"defining-custom-paramters"},"Defining Custom Paramters"),(0,r.kt)("p",null,"You can define your own custom parameters using the ",(0,r.kt)("inlineCode",{parentName:"p"},"defineParameterType")," function.\nIt takes a spread array of parameter type definition objects. A good place\nto call this function is your ",(0,r.kt)("inlineCode",{parentName:"p"},"autometa.config.ts")," file."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},'defineParameterType(\n  {\n    name: "boolean",\n    regex: /true|false/,\n    type: Number,\n    transform: (value): boolean => {\n      if (value === "true") {\n        return true;\n      }\n      if (value === "false") {\n        return false;\n      }\n      throw new Error("Unknown boolean " + value);\n    },\n  },\n  {\n    name: "number",\n    regex: FLOAT_REGEXP,\n    type: Number,\n    transform: (value) => {\n      const transformed = Number(value);\n      if (isNaN(transformed)) {\n        throw new Error(`${value} can not be transformed into a number`);\n      }\n      return transformed;\n    },\n  }\n);\n')),(0,r.kt)("h2",{id:"regular-expressions"},"Regular Expressions"),(0,r.kt)("p",null,"Regular Expressions work similar to cucumber expressions but of course\nusing RegEx matchers. Regex Matches are not converted to a new type\nand will be passed as strings. Cucumber expressions are recommended\nover Regular Expressions."),(0,r.kt)("h2",{id:"examples-table"},"Examples Table"),(0,r.kt)("p",null,"Step text in a ",(0,r.kt)("inlineCode",{parentName:"p"},"Scenario Outline")," may contain angle brackets representing\na value of the ",(0,r.kt)("inlineCode",{parentName:"p"},"Examples")," table. At run time, for each row of examples,\nthe value in the angle bracket will be replaced by its matching examples value.\nThis value can be extracted as normal using Cucumber Expressions."),(0,r.kt)(l.Z,{mdxType:"Tabs"},(0,r.kt)(u.Z,{value:"gherkin",label:"Gherkin",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-gherkin"},"Feature: My Feature\n    Scenario outline:\n        Given a <color> <object>\n    Examples\n        | color | object |\n        | blue  | ball   |\n        | red   | truck  |\n"))),(0,r.kt)(u.Z,{value:"typescript",label:"Typescript",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},'import { Feature, Given } from "@autometa/cucumber-runner";\n\nFeature(() => {\n  Given("a {word} {word}", (color: string, object: string) => {\n    console.log(color); // blue, red\n    console.log(object); // ball, truck\n  });\n}, "./my-feature.feature");\n')))),(0,r.kt)("h2",{id:"datatables"},"Datatables"),(0,r.kt)("p",null,"See ",(0,r.kt)("a",{parentName:"p",href:"./datatables"},"Datatables")),(0,r.kt)("h2",{id:"docstring"},"Docstring"),(0,r.kt)("p",null,"A docstring is attached to a step with three quotation marks"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-gherkin"},'Given a step with a docstring\n """\n    This is my docstring\n """\n')),(0,r.kt)("p",null,"Docstrings can also contain a mimetype"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-gherkin"},'Given a step with a docstring\n """json\n    { a: 1, b: [2,3] }\n """\n')),(0,r.kt)("p",null,"If a docstring is defined, it will always be passed as the second to\nlast argument and has type ",(0,r.kt)("inlineCode",{parentName:"p"},"Docstring"),"."),(0,r.kt)("p",null,"A docstring cannot be defined when a data table is defined. They are mutually\nexclusive."))}b.isMDXComponent=!0}}]);