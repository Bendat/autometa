"use strict";(self.webpackChunk_autometa_documentation=self.webpackChunk_autometa_documentation||[]).push([[3832],{4993:(e,t,a)=>{a.d(t,{Zo:()=>c,kt:()=>d});var n=a(2983);function r(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function l(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,n)}return a}function o(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?l(Object(a),!0).forEach((function(t){r(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):l(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function i(e,t){if(null==e)return{};var a,n,r=function(e,t){if(null==e)return{};var a,n,r={},l=Object.keys(e);for(n=0;n<l.length;n++)a=l[n],t.indexOf(a)>=0||(r[a]=e[a]);return r}(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(n=0;n<l.length;n++)a=l[n],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(r[a]=e[a])}return r}var s=n.createContext({}),u=function(e){var t=n.useContext(s),a=t;return e&&(a="function"==typeof e?e(t):o(o({},t),e)),a},c=function(e){var t=u(e.components);return n.createElement(s.Provider,{value:t},e.children)},p="mdxType",m={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},b=n.forwardRef((function(e,t){var a=e.components,r=e.mdxType,l=e.originalType,s=e.parentName,c=i(e,["components","mdxType","originalType","parentName"]),p=u(a),b=r,d=p["".concat(s,".").concat(b)]||p[b]||m[b]||l;return a?n.createElement(d,o(o({ref:t},c),{},{components:a})):n.createElement(d,o({ref:t},c))}));function d(e,t){var a=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var l=a.length,o=new Array(l);o[0]=b;var i={};for(var s in t)hasOwnProperty.call(t,s)&&(i[s]=t[s]);i.originalType=e,i[p]="string"==typeof e?e:r,o[1]=i;for(var u=2;u<l;u++)o[u]=a[u];return n.createElement.apply(null,o)}return n.createElement.apply(null,a)}b.displayName="MDXCreateElement"},1949:(e,t,a)=>{a.d(t,{Z:()=>o});var n=a(2983),r=a(4517);const l={tabItem:"tabItem_BTU7"};function o(e){let{children:t,hidden:a,className:o}=e;return n.createElement("div",{role:"tabpanel",className:(0,r.Z)(l.tabItem,o),hidden:a},t)}},837:(e,t,a)=>{a.d(t,{Z:()=>w});var n=a(3050),r=a(2983),l=a(4517),o=a(2967),i=a(3729),s=a(7742),u=a(7392),c=a(1419);function p(e){return function(e){return r.Children.map(e,(e=>{if(!e||(0,r.isValidElement)(e)&&function(e){const{props:t}=e;return!!t&&"object"==typeof t&&"value"in t}(e))return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))?.filter(Boolean)??[]}(e).map((e=>{let{props:{value:t,label:a,attributes:n,default:r}}=e;return{value:t,label:a,attributes:n,default:r}}))}function m(e){const{values:t,children:a}=e;return(0,r.useMemo)((()=>{const e=t??p(a);return function(e){const t=(0,u.l)(e,((e,t)=>e.value===t.value));if(t.length>0)throw new Error(`Docusaurus error: Duplicate values "${t.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[t,a])}function b(e){let{value:t,tabValues:a}=e;return a.some((e=>e.value===t))}function d(e){let{queryString:t=!1,groupId:a}=e;const n=(0,i.k6)(),l=function(e){let{queryString:t=!1,groupId:a}=e;if("string"==typeof t)return t;if(!1===t)return null;if(!0===t&&!a)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return a??null}({queryString:t,groupId:a});return[(0,s._X)(l),(0,r.useCallback)((e=>{if(!l)return;const t=new URLSearchParams(n.location.search);t.set(l,e),n.replace({...n.location,search:t.toString()})}),[l,n])]}function f(e){const{defaultValue:t,queryString:a=!1,groupId:n}=e,l=m(e),[o,i]=(0,r.useState)((()=>function(e){let{defaultValue:t,tabValues:a}=e;if(0===a.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(t){if(!b({value:t,tabValues:a}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${t}" but none of its children has the corresponding value. Available values are: ${a.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return t}const n=a.find((e=>e.default))??a[0];if(!n)throw new Error("Unexpected error: 0 tabValues");return n.value}({defaultValue:t,tabValues:l}))),[s,u]=d({queryString:a,groupId:n}),[p,f]=function(e){let{groupId:t}=e;const a=function(e){return e?`docusaurus.tab.${e}`:null}(t),[n,l]=(0,c.Nk)(a);return[n,(0,r.useCallback)((e=>{a&&l.set(e)}),[a,l])]}({groupId:n}),h=(()=>{const e=s??p;return b({value:e,tabValues:l})?e:null})();(0,r.useLayoutEffect)((()=>{h&&i(h)}),[h]);return{selectedValue:o,selectValue:(0,r.useCallback)((e=>{if(!b({value:e,tabValues:l}))throw new Error(`Can't select invalid tab value=${e}`);i(e),u(e),f(e)}),[u,f,l]),tabValues:l}}var h=a(3500);const g={tabList:"tabList_laEr",tabItem:"tabItem_VkkT"};function k(e){let{className:t,block:a,selectedValue:i,selectValue:s,tabValues:u}=e;const c=[],{blockElementScrollPositionUntilNextRender:p}=(0,o.o5)(),m=e=>{const t=e.currentTarget,a=c.indexOf(t),n=u[a].value;n!==i&&(p(t),s(n))},b=e=>{let t=null;switch(e.key){case"Enter":m(e);break;case"ArrowRight":{const a=c.indexOf(e.currentTarget)+1;t=c[a]??c[0];break}case"ArrowLeft":{const a=c.indexOf(e.currentTarget)-1;t=c[a]??c[c.length-1];break}}t?.focus()};return r.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,l.Z)("tabs",{"tabs--block":a},t)},u.map((e=>{let{value:t,label:a,attributes:o}=e;return r.createElement("li",(0,n.Z)({role:"tab",tabIndex:i===t?0:-1,"aria-selected":i===t,key:t,ref:e=>c.push(e),onKeyDown:b,onClick:m},o,{className:(0,l.Z)("tabs__item",g.tabItem,o?.className,{"tabs__item--active":i===t})}),a??t)})))}function v(e){let{lazy:t,children:a,selectedValue:n}=e;const l=(Array.isArray(a)?a:[a]).filter(Boolean);if(t){const e=l.find((e=>e.props.value===n));return e?(0,r.cloneElement)(e,{className:"margin-top--md"}):null}return r.createElement("div",{className:"margin-top--md"},l.map(((e,t)=>(0,r.cloneElement)(e,{key:t,hidden:e.props.value!==n}))))}function y(e){const t=f(e);return r.createElement("div",{className:(0,l.Z)("tabs-container",g.tabList)},r.createElement(k,(0,n.Z)({},e,t)),r.createElement(v,(0,n.Z)({},e,t)))}function w(e){const t=(0,h.Z)();return r.createElement(y,(0,n.Z)({key:String(t)},e))}},7506:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>c,contentTitle:()=>s,default:()=>d,frontMatter:()=>i,metadata:()=>u,toc:()=>p});var n=a(3050),r=(a(2983),a(4993)),l=a(837),o=a(1949);const i={sidebar_position:3},s="Data Tables",u={unversionedId:"cucumber/test_runner/datatables",id:"cucumber/test_runner/datatables",title:"Data Tables",description:"Autometa sports a more sophisticated data table model than the default",source:"@site/docs/cucumber/test_runner/datatables.mdx",sourceDirName:"cucumber/test_runner",slug:"/cucumber/test_runner/datatables",permalink:"/autometa/docs/cucumber/test_runner/datatables",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/cucumber/test_runner/datatables.mdx",tags:[],version:"current",sidebarPosition:3,frontMatter:{sidebar_position:3},sidebar:"cucumberRunnerBar",previous:{title:"Step Definitions",permalink:"/autometa/docs/cucumber/test_runner/step_definitions"},next:{title:"Step Arguments",permalink:"/autometa/docs/cucumber/test_runner/step-arguments"}},c={},p=[{value:"HTable",id:"htable",level:2},{value:"Custom Tables",id:"custom-tables",level:2}],m={toc:p},b="wrapper";function d(e){let{components:t,...a}=e;return(0,r.kt)(b,(0,n.Z)({},m,a,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"data-tables"},"Data Tables"),(0,r.kt)("p",null,"Autometa sports a more sophisticated data table model than the default\n",(0,r.kt)("inlineCode",{parentName:"p"},"Cucumber.js "),"implementation. Specifically, there are multiple table types\nwhich can be configured on a per step basis."),(0,r.kt)("p",null,"When a step contains a table, it will be passed to the matching definition\ncallback according to the following rules:"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"If the Gherkin step contains a table, and none is defined in the matching definition\nan error will be thrown"),(0,r.kt)("li",{parentName:"ul"},"If no ",(0,r.kt)("a",{parentName:"li",href:"./cucumber_expressions"},"expressions")," exist, then the Data Table will\nbe injected as the first argument in the definition callback"),(0,r.kt)("li",{parentName:"ul"},"If at least one expression exists, the Data Table will be the next argument\npassed after all expressions")),(0,r.kt)("p",null,"The currently supported table types are:"),(0,r.kt)("h2",{id:"htable"},"HTable"),(0,r.kt)("p",null,"A standard 'horizontal' table, where the first row of the table is\ntreated as a header cell, and values can be accessed by indexing against that header"),(0,r.kt)(l.Z,{mdxType:"Tabs"},(0,r.kt)(o.Z,{value:"gherkin",label:"Gherkin Datatable",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-gherkin"},"Given a step with a table\n  | Username | Is Admin |\n  | Bob      | true    |\n  | Jill     | false   |\n"))),(0,r.kt)(o.Z,{value:"definition",label:"Step Definition",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},'Given(\n  "a step with a table",\n  (table) => {\n    const bob = table.get<string>("Username", 0);\n    const bobIsAdmin = table.get<number>("Is Admin", 0);\n    const allUsers = table.get<string[]>("Username");\n  },\n  HTable\n);\n')))),(0,r.kt)("h1",{id:"vtable"},"VTable"),(0,r.kt)("p",null,"A standard 'vertical' whose header cells are stacked vertically on the leftmost column"),(0,r.kt)(l.Z,{mdxType:"Tabs"},(0,r.kt)(o.Z,{value:"gherkin",label:"Gherkin Datatable",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-gherkin"},"Given a step with a table\n  | Username | Bob  | Jill  |\n  | Is Admin | true | false |\n"))),(0,r.kt)(o.Z,{value:"definition",label:"Step Definition",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},'Given(\n  "a step with a table",\n  (table) => {\n    const bob = table.get<string>("Username", 0);\n    const bobIsAdmin = table.get<number>("Is Admin", 0);\n    const allUsers = table.get<string[]>("Username");\n  },\n  VTable\n);\n')))),(0,r.kt)("h1",{id:"mtable"},"MTable"),(0,r.kt)("p",null,"A Matrix tyle table, where the first row and first column are both treated as headers,\nindexing against both will return the value of a single cell."),(0,r.kt)(l.Z,{mdxType:"Tabs"},(0,r.kt)(o.Z,{value:"gherkin",label:"Gherkin Datatable",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-gherkin"},"Given a step with a table\n  |       | Big     | Small   |\n  | Blue  | Ocean   | Puddle  |\n  | Green | Ireland | Cabbage |\n"))),(0,r.kt)(o.Z,{value:"definition",label:"Step Definition",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},'Given(\n  "a step with a table",\n  (table) => {\n    const ocean = table.get<string>("Blue", "Big");\n    const cabbage = table.get<string>("Green", "Small");\n  },\n  MTable\n);\n')))),"## Table Value Types",(0,r.kt)("p",null,"By default, tables will attempt to convert their cell values into a primitive type.\nI.e. ",(0,r.kt)("inlineCode",{parentName:"p"},"| 2 |")," will attempt to parse this cell as a number, ",(0,r.kt)("inlineCode",{parentName:"p"},"true")," will become a bool etc."),(0,r.kt)("p",null,"To access the unconverted raw value, pass true to the end of the ",(0,r.kt)("inlineCode",{parentName:"p"},".get")," method"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},'Given("step with table", (table) => {\n  const firstUsername = table.get<string>("Username", 0);\n  const firstAge = table.get<string>("Age", 0, true);\n  // ...\n});\n')),(0,r.kt)("h2",{id:"custom-tables"},"Custom Tables"),(0,r.kt)("p",null,"It is possible to implement your own table. Simply create a class which accepts as a constructor parameter\nand instance of ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/Bendat/autometa/blob/main/packages/gherkin/src/steps/datatables/compiled-data-table.ts"},"CompiledDataTable"),"."),(0,r.kt)("p",null,"The compiled table contains two 2d arrays:"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"table"),(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"List of converted types. I.e ",(0,r.kt)("inlineCode",{parentName:"li"},"| 2 |")," will become ",(0,r.kt)("inlineCode",{parentName:"li"},"2")," not ",(0,r.kt)("inlineCode",{parentName:"li"},'"2"')))),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"rawTable"),(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"List of unconverted types. I.e ",(0,r.kt)("inlineCode",{parentName:"li"},"| 2 |")," will remain ",(0,r.kt)("inlineCode",{parentName:"li"},'"2"')," not ",(0,r.kt)("inlineCode",{parentName:"li"},"2"))))),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},'import { CompiledDataTable } from "@autometa/runner";\n\nexport class MyTable {\n    constructor(private readonly compiledTable: CompiledDataTable) {}\n\n    get<T>(header: string, row: number, raw = false): T {\n        // Your get logic here\n    }\n}\n\n')),(0,r.kt)("hr",null),(0,r.kt)("p",null,"There is no common interface for what methods can be on a table, so you will need to\ndecide your own."))}d.isMDXComponent=!0}}]);