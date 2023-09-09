"use strict";(self.webpackChunk_autometa_documentation=self.webpackChunk_autometa_documentation||[]).push([[5750],{4993:(e,t,a)=>{a.d(t,{Zo:()=>u,kt:()=>d});var n=a(2983);function l(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function r(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,n)}return a}function i(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?r(Object(a),!0).forEach((function(t){l(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):r(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function o(e,t){if(null==e)return{};var a,n,l=function(e,t){if(null==e)return{};var a,n,l={},r=Object.keys(e);for(n=0;n<r.length;n++)a=r[n],t.indexOf(a)>=0||(l[a]=e[a]);return l}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(n=0;n<r.length;n++)a=r[n],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(l[a]=e[a])}return l}var s=n.createContext({}),c=function(e){var t=n.useContext(s),a=t;return e&&(a="function"==typeof e?e(t):i(i({},t),e)),a},u=function(e){var t=c(e.components);return n.createElement(s.Provider,{value:t},e.children)},p="mdxType",b={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},m=n.forwardRef((function(e,t){var a=e.components,l=e.mdxType,r=e.originalType,s=e.parentName,u=o(e,["components","mdxType","originalType","parentName"]),p=c(a),m=l,d=p["".concat(s,".").concat(m)]||p[m]||b[m]||r;return a?n.createElement(d,i(i({ref:t},u),{},{components:a})):n.createElement(d,i({ref:t},u))}));function d(e,t){var a=arguments,l=t&&t.mdxType;if("string"==typeof e||l){var r=a.length,i=new Array(r);i[0]=m;var o={};for(var s in t)hasOwnProperty.call(t,s)&&(o[s]=t[s]);o.originalType=e,o[p]="string"==typeof e?e:l,i[1]=o;for(var c=2;c<r;c++)i[c]=a[c];return n.createElement.apply(null,i)}return n.createElement.apply(null,a)}m.displayName="MDXCreateElement"},7179:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>s,contentTitle:()=>i,default:()=>b,frontMatter:()=>r,metadata:()=>o,toc:()=>c});var n=a(3050),l=(a(2983),a(4993));const r={sidebar_position:4},i="Data Tables",o={unversionedId:"cucumber/test_runner_legacy/datatables",id:"cucumber/test_runner_legacy/datatables",title:"Data Tables",description:"Datatables are tables attached to a gherkin step",source:"@site/docs/cucumber/test_runner_legacy/datatables.mdx",sourceDirName:"cucumber/test_runner_legacy",slug:"/cucumber/test_runner_legacy/datatables",permalink:"/autometa/docs/cucumber/test_runner_legacy/datatables",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/cucumber/test_runner_legacy/datatables.mdx",tags:[],version:"current",sidebarPosition:4,frontMatter:{sidebar_position:4},sidebar:"cucumberRunnerBarLegacy",previous:{title:"Step Arguments",permalink:"/autometa/docs/cucumber/test_runner_legacy/step-arguments"},next:{title:"App & World",permalink:"/autometa/docs/cucumber/test_runner_legacy/app"}},s={},c=[{value:"Horizontal Table",id:"horizontal-table",level:2},{value:"Vertical Table",id:"vertical-table",level:2},{value:"Matrix Table",id:"matrix-table",level:2},{value:"List Table",id:"list-table",level:2}],u={toc:c},p="wrapper";function b(e){let{components:t,...a}=e;return(0,l.kt)(p,(0,n.Z)({},u,a,{components:t,mdxType:"MDXLayout"}),(0,l.kt)("h1",{id:"data-tables"},"Data Tables"),(0,l.kt)("p",null,"Datatables are tables attached to a gherkin step"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-gherkin"},"Given a step with a table\n    | name | age |\n    | John | 24  |\n")),(0,l.kt)("p",null,"If one is defined, it will always be the second to last argument passed\nto a step definition callback function. If there are no cucumber expression\narguments, it will be the first argument."),(0,l.kt)("p",null,"This library includes extended handling of data tables inspired by\nthe ",(0,l.kt)("a",{parentName:"p",href:"https://github.com/cucumber/cucumber-jvm/tree/main/cucumber-java#data-tables"},"Java Implementation")),(0,l.kt)("p",null,"Tables can be defined with multiple different structual formats.\nBy default, tables will be converted to ",(0,l.kt)("inlineCode",{parentName:"p"},"HTable"),", for...."),(0,l.kt)("h2",{id:"horizontal-table"},"Horizontal Table"),(0,l.kt)("p",null,"class: ",(0,l.kt)("inlineCode",{parentName:"p"},"HTable")),(0,l.kt)("p",null,"The horizontal table assumes that the first row of the table structure\nis a list of headings or titles that describe the purpose of the column\nbelow it."),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-gherkin"},"Given a step with a table\n    | name | age |\n    | John | 24  |\n    | Bill | 25  |\n")),(0,l.kt)("p",null,"The HTable accesses data using this header."),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-ts"},'Given("a table", (table: HTable) => {\n  expect(table.get("name")).toEqual(["John", "Bill"]);\n  expect(table.get("name", 0)).toEqual("John");\n  expect(table.get("age")).toEqual([24, 25]);\n  expect(table.get("age", 0)).toEqual(24);\n});\n')),(0,l.kt)("h2",{id:"vertical-table"},"Vertical Table"),(0,l.kt)("p",null,"class: ",(0,l.kt)("inlineCode",{parentName:"p"},"VTable")),(0,l.kt)("p",null,"The vertical table assumes that the first column of the table structure\nis a list of headings or titles that describe the purpose of the row\nto the right of it."),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-gherkin"},"Given a step with a table\n    | name | John | Bill |\n    | age  | 24   | 25   |\n")),(0,l.kt)("p",null,"The VTable accesses data using this header."),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-ts"},'Given("a table", (table: VTable) => {\n  expect(table.get("name")).toEqual(["John", "Bill"]);\n  expect(table.get("name", 0)).toEqual("John");\n  expect(table.get("age")).toEqual([24, 25]);\n  expect(table.get("age", 0)).toEqual(24);\n});\n')),(0,l.kt)("admonition",{type:"tip"},(0,l.kt)("p",{parentName:"admonition"},"By default all tables will be converted to ",(0,l.kt)("inlineCode",{parentName:"p"},"HTable"),". This can\nbe overwritten in ",(0,l.kt)("inlineCode",{parentName:"p"},"autometa.config.ts"),", or configured on a step by\nstep bases. Taking the above step as an example, to tell Autometa that\nwe want to use a VTable specifically for this step, we pass the VTable\nclass prototype as the third step definition argument:"),(0,l.kt)("pre",{parentName:"admonition"},(0,l.kt)("code",{parentName:"pre",className:"language-ts"},'Given(\n  "a table",\n  (table: VTable) => {\n    expect(table.get("name")).toEqual(["John", "Bill"]);\n    expect(table.get("name", 0)).toEqual("John");\n    expect(table.get("age")).toEqual([24, 25]);\n    expect(table.get("age", 0)).toEqual(24);\n  },\n  VTable\n);\n')),(0,l.kt)("p",{parentName:"admonition"},"This step will now be constructed with a VTable.")),(0,l.kt)("h2",{id:"matrix-table"},"Matrix Table"),(0,l.kt)("p",null,"class: ",(0,l.kt)("inlineCode",{parentName:"p"},"MTable")),(0,l.kt)("p",null,"The matrix table is similar to a HTable ",(0,l.kt)("em",{parentName:"p"},"and")," a VTable at the same time.\nIt assumes the first row is a list of titles for the columns below it,\nwhile the first colum is a list of titles for the row cells to the right\nof it. A cell is then an intersection of these two values."),(0,l.kt)("p",null,"The first cell (0,0) is discarded and ignored. You may use it\nto hold metatext about the table such as it's axis"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-gherkin"},"Given a step with a table\n    | size/color | large | small   |\n    | blue       | ocean | gumball |\n    | green      | hill  | grass   |\n")),(0,l.kt)("p",null,"The HTable accesses data using this header."),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-ts"},'Given("a table", (table: MTable) => {\n  expect(table.get("blue", "large")).toEqual("ocean");\n  expect(table.get("green", "small")).toEqual("grass");\n});\n')),(0,l.kt)("h2",{id:"list-table"},"List Table"),(0,l.kt)("p",null,"class: ",(0,l.kt)("inlineCode",{parentName:"p"},"ListTable")),(0,l.kt)("p",null,"A list table assumes there are no special rows or columns which act\nas headers. Effectively a wrapper over a ",(0,l.kt)("inlineCode",{parentName:"p"},"string[][]"),"."),(0,l.kt)("h1",{id:"type-casting"},"Type Casting"),(0,l.kt)("p",null,"Autometa will attempt to parse table values into javascript primitives\nif they are applicable. Currently supported are ",(0,l.kt)("inlineCode",{parentName:"p"},"boolean")," and ",(0,l.kt)("inlineCode",{parentName:"p"},"number"),"."),(0,l.kt)("p",null,"That is to say, if a table cell contains the string ",(0,l.kt)("inlineCode",{parentName:"p"},"2"),", it will be cast\nto an number. Likewise ",(0,l.kt)("inlineCode",{parentName:"p"},"true")," will be a bool. This does not apply if they are\nsurrounded by quotation marks, i.e ",(0,l.kt)("inlineCode",{parentName:"p"},'"2"')," will not parse to a number."))}b.isMDXComponent=!0}}]);